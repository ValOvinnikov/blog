// Checks that every ISR tag literal passed to `isr(...)` across
// packages/service/src is registered in apps/web's `REVALIDATE_TAGS` map
// (apps/web/src/utils/revalidate-tags/revalidate-tags.ts) — the revalidation
// webhook's `_type` → tag lookup. A tag missing from that map's value union
// means a publish for that document type never purges it: the webhook has
// no per-tag Object.hasOwn miss to report, so this is the only guard against
// that failure class.
//
// Extraction covers these tag shapes emitted by real call sites:
//   - a string/array literal passed directly to `isr(...)`;
//   - a `module:${id}` (or similarly substituted) template element inside
//     that array — always skipped, since it is a per-document dynamic tag,
//     not a registrable one (`getRevalidateTagsForType` appends it itself
//     for any `module_*` type);
//   - an `isr(tags, ...)` call where `tags` is a bare identifier bound to a
//     parameter of some enclosing function `F` (directly, or via an
//     object-destructured parameter) — resolved by tracing `F` to a name and
//     scanning every call site of `F` across the scanned files for the
//     literal value passed for that parameter.
// A bare identifier that cannot be traced this way, or whose traced call
// site(s) don't yield a literal, is never silently dropped — it is reported
// as unresolved, same as any other shape this script cannot statically
// resolve. A blind spot here would be worse than no guard at all.
//
// Run with `pnpm check:revalidate-tags-sync`. Read-only; exits 1 on any
// mismatch or unrecognised call shape.
import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');

const REVALIDATE_TAGS_FILE = join(
  repoRoot,
  'apps/web/src/utils/revalidate-tags/revalidate-tags.ts',
);
const SERVICE_SRC_DIR = join(repoRoot, 'packages/service/src');

// Exported so the fixture tests can build a source file from an inline string
// instead of a file on disk.
export const parseSource = (file, text) =>
  ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );

const parse = (file) => parseSource(file, readFileSync(file, 'utf8'));

export const listServiceSourceFiles = (
  dir = SERVICE_SRC_DIR,
  readdir = readdirSync,
) =>
  readdir(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .filter((entry) => !entry.name.endsWith('.test.ts'))
    .map((entry) => join(entry.parentPath ?? entry.path, entry.name));

const isStringLike = (node) =>
  ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);

/**
 * Every string literal found in a `REVALIDATE_TAGS`-shaped object literal's
 * array-valued properties (`{ key: ['tag', ...], ... }`), regardless of how
 * the object literal itself is wrapped (`as const satisfies ...`).
 */
export const extractRevalidateTagValues = (sf) => {
  const values = new Set();
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'REVALIDATE_TAGS' &&
      node.initializer
    ) {
      let objectLiteral = node.initializer;
      while (
        ts.isAsExpression(objectLiteral) ||
        ts.isSatisfiesExpression(objectLiteral)
      ) {
        objectLiteral = objectLiteral.expression;
      }
      if (ts.isObjectLiteralExpression(objectLiteral)) {
        for (const prop of objectLiteral.properties) {
          if (
            ts.isPropertyAssignment(prop) &&
            ts.isArrayLiteralExpression(prop.initializer)
          ) {
            for (const element of prop.initializer.elements) {
              if (isStringLike(element)) values.add(element.text);
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return values;
};

// A relative-path formatter for reporting; keeps output stable across
// machines instead of leaking each contributor's absolute checkout path.
const toRelative = (file) => relative(repoRoot, file);

/**
 * Every string-literal/template element of an array literal, sorted into
 * `tags` (plain strings), `dynamic` (substituted templates — a per-document
 * runtime tag) or `unresolved` (anything else) on the given collections.
 */
const collectArrayLiteralElements = (arrayLiteral, sf, fileRel, target) => {
  for (const element of arrayLiteral.elements) {
    if (isStringLike(element)) {
      target.tags.add(element.text);
    } else if (ts.isTemplateExpression(element)) {
      target.dynamic.push({ file: fileRel, text: element.getText(sf) });
    } else {
      target.unresolved.push({ file: fileRel, text: element.getText(sf) });
    }
  }
};

/**
 * Walks upward from `node` through enclosing function-like scopes to find
 * the nearest one that binds a parameter named `name` — either directly
 * (`function f(name)`) or via an object-destructured parameter
 * (`function f({ name })` or `function f({ renamed: name })`). Returns the
 * binding's function node, its parameter index, and (for the destructured
 * case) the property name to look up at a call site — or `null` if no
 * enclosing function declares such a binding.
 */
const findEnclosingParamBinding = (node, name) => {
  let current = node.parent;
  while (current) {
    if (ts.isFunctionLike(current)) {
      for (
        let paramIndex = 0;
        paramIndex < current.parameters.length;
        paramIndex += 1
      ) {
        const param = current.parameters[paramIndex];
        if (ts.isIdentifier(param.name) && param.name.text === name) {
          return { fn: current, paramIndex, propName: null };
        }
        if (ts.isObjectBindingPattern(param.name)) {
          for (const element of param.name.elements) {
            if (element.dotDotDotToken || !ts.isIdentifier(element.name)) {
              continue;
            }
            if (element.name.text !== name) continue;
            const propName =
              element.propertyName && ts.isIdentifier(element.propertyName)
                ? element.propertyName.text
                : name;
            return { fn: current, paramIndex, propName };
          }
        }
      }
    }
    current = current.parent;
  }
  return null;
};

/** The callable name of a function-like node, if it has one resolvable by name across files. */
const resolveFunctionName = (fn) => {
  if (ts.isFunctionDeclaration(fn)) return fn.name?.text ?? null;
  if (
    (ts.isFunctionExpression(fn) || ts.isArrowFunction(fn)) &&
    fn.parent &&
    ts.isVariableDeclaration(fn.parent) &&
    ts.isIdentifier(fn.parent.name)
  ) {
    return fn.parent.name.text;
  }
  return null;
};

/**
 * Every ISR tag literal reachable in a source file: direct `isr(...)`
 * string/array-literal arguments, plus (unresolved at this stage) any
 * `isr(...)` call whose argument is a bare identifier bound to an enclosing
 * function's parameter — recorded in `pending` for `collectServiceTags` to
 * resolve against every call site of that function across all scanned files.
 *
 * Also returns `dynamic` (template-literal elements with substitutions,
 * always a per-document id tag, correctly skipped) and `unresolved` (any
 * `isr(...)` first argument this script cannot classify) so the caller can
 * report both instead of extraction silently dropping them. `callSites`
 * records every call expression's arguments, keyed by callee name, for the
 * cross-file resolution pass.
 */
export const extractServiceCallSiteTags = (file, sf) => {
  const fileRel = toRelative(file);
  const tags = new Set();
  const dynamic = [];
  const unresolved = [];
  const pending = [];
  const callSites = new Map();

  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const calleeName = node.expression.text;
      if (!callSites.has(calleeName)) callSites.set(calleeName, []);
      callSites.get(calleeName).push(node.arguments);

      if (calleeName === 'isr' && node.arguments[0]) {
        const arg = node.arguments[0];
        if (isStringLike(arg)) {
          tags.add(arg.text);
        } else if (ts.isArrayLiteralExpression(arg)) {
          collectArrayLiteralElements(arg, sf, fileRel, {
            tags,
            dynamic,
            unresolved,
          });
        } else if (ts.isIdentifier(arg)) {
          const binding = findEnclosingParamBinding(arg, arg.text);
          const factoryName = binding ? resolveFunctionName(binding.fn) : null;
          if (binding && factoryName) {
            pending.push({
              factoryName,
              paramIndex: binding.paramIndex,
              propName: binding.propName,
              file: fileRel,
              text: arg.getText(sf),
            });
          } else {
            unresolved.push({ file: fileRel, text: arg.getText(sf) });
          }
        } else {
          unresolved.push({ file: fileRel, text: arg.getText(sf) });
        }
      }
    }

    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { tags, dynamic, unresolved, pending, callSites };
};

/**
 * Resolves every `pending` bare-identifier `isr(...)` argument against the
 * traced factory function's call sites collected across all scanned files.
 * A pending entry with no matching call site, or whose resolved argument
 * isn't itself a literal, is pushed to `unresolved` rather than dropped —
 * this is the step that must never silently pass.
 */
const resolvePendingCallSiteTags = (pending, callSitesByName, target) => {
  for (const entry of pending) {
    const sites = callSitesByName.get(entry.factoryName) ?? [];
    let resolvedAny = false;

    for (const args of sites) {
      const arg = args[entry.paramIndex];
      if (!arg) continue;

      let valueNode = arg;
      if (entry.propName !== null) {
        if (!ts.isObjectLiteralExpression(arg)) continue;
        const prop = arg.properties.find(
          (p) =>
            ts.isPropertyAssignment(p) &&
            ts.isIdentifier(p.name) &&
            p.name.text === entry.propName,
        );
        if (!prop) continue;
        valueNode = prop.initializer;
      }

      resolvedAny = true;
      if (isStringLike(valueNode)) {
        target.tags.add(valueNode.text);
      } else if (ts.isArrayLiteralExpression(valueNode)) {
        collectArrayLiteralElements(valueNode, undefined, entry.file, target);
      } else {
        target.unresolved.push({
          file: entry.file,
          text: valueNode.getText(),
        });
      }
    }

    if (!resolvedAny) {
      target.unresolved.push({ file: entry.file, text: entry.text });
    }
  }
};

export const collectServiceTags = (files, parseFn = (f) => parse(f)) => {
  const tags = new Set();
  const dynamic = [];
  const unresolved = [];
  const pending = [];
  const callSitesByName = new Map();

  for (const file of files) {
    const result = extractServiceCallSiteTags(file, parseFn(file));
    for (const tag of result.tags) tags.add(tag);
    dynamic.push(...result.dynamic);
    unresolved.push(...result.unresolved);
    pending.push(...result.pending);
    for (const [calleeName, sites] of result.callSites) {
      if (!callSitesByName.has(calleeName)) callSitesByName.set(calleeName, []);
      callSitesByName.get(calleeName).push(...sites);
    }
  }

  resolvePendingCallSiteTags(pending, callSitesByName, {
    tags,
    dynamic,
    unresolved,
  });

  return { tags, dynamic, unresolved };
};

export const findMissingTags = (serviceTags, revalidateTagValues) =>
  [...serviceTags].filter((tag) => !revalidateTagValues.has(tag)).sort();

const formatReport = (missing, unresolved, revalidateTagsRelPath) => {
  const lines = [];
  if (missing.length) {
    lines.push(
      `REVALIDATE_TAGS (${revalidateTagsRelPath}) is missing an entry for tag(s) ` +
        `passed to isr(...) in packages/service/src: ${missing.join(', ')}`,
      '',
      'Add each tag to the matching entry in REVALIDATE_TAGS, or remove it from ' +
        'the loader if it was added by mistake.',
    );
  }
  if (unresolved.length) {
    if (lines.length) lines.push('');
    lines.push(
      'Found isr(...) call site(s) whose tag argument this script cannot ' +
        'statically resolve to a literal — fix the call to pass a string/array ' +
        'literal (or extend check-revalidate-tags-sync.mjs to handle the new shape):',
    );
    for (const { file, text } of unresolved) {
      lines.push(`  ${file}: ${text}`);
    }
  }
  return lines.join('\n');
};

const main = () => {
  const revalidateTagValues = extractRevalidateTagValues(
    parse(REVALIDATE_TAGS_FILE),
  );
  const files = listServiceSourceFiles();
  const { tags, dynamic, unresolved } = collectServiceTags(files);
  const missing = findMissingTags(tags, revalidateTagValues);

  if (dynamic.length) {
    console.log(
      `Skipped ${dynamic.length} dynamic per-document tag(s) (e.g. ` +
        '`module:${id}`) — these are appended at runtime, not registered:',
    );
    for (const { file, text } of dynamic) {
      console.log(`  ${file}: ${text}`);
    }
  }

  if (missing.length || unresolved.length) {
    console.error(
      formatReport(
        missing,
        unresolved,
        relative(repoRoot, REVALIDATE_TAGS_FILE),
      ),
    );
    process.exit(1);
  }

  console.log(
    `REVALIDATE_TAGS covers every isr(...) tag literal found across ${files.length} ` +
      'packages/service/src file(s).',
  );
};

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}

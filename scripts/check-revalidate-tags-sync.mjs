// Checks that every ISR tag literal passed to `isr(...)` across
// packages/service/src is registered in apps/web's `REVALIDATE_TAGS` map
// (apps/web/src/utils/revalidate-tags/revalidate-tags.ts) — the revalidation
// webhook's `_type` → tag lookup. A tag missing from that map's value union
// means a publish for that document type never purges it: the webhook has
// no per-tag Object.hasOwn miss to report, so this is the only guard against
// that failure class.
//
// Extraction covers three tag shapes emitted by real call sites:
//   - a string/array literal passed directly to `isr(...)`;
//   - a `module:${id}` (or similarly substituted) template element inside
//     that array — always skipped, since it is a per-document dynamic tag,
//     not a registrable one (`getRevalidateTagsForType` appends it itself
//     for any `module_*` type);
//   - an `isr(tags, ...)` call where `tags` is a bare identifier — resolved
//     by also collecting every `tags: [...]` string-literal-array property
//     anywhere in the scanned files (the shape `createTaxonomyIndexPageLoader`
//     callers use to hand a literal list to a shared loader factory).
// Anything else passed as `isr(...)`'s first argument is not statically
// analysable by this script and fails the run rather than being silently
// skipped — a blind spot here would be worse than no guard at all.
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
 * Every ISR tag literal reachable in a source file: direct `isr(...)`
 * string/array-literal arguments, plus any `tags: [...]` string-literal-array
 * object property (the shape a caller uses to hand a literal list to a
 * shared loader factory that itself calls `isr(tags, ...)`).
 *
 * Also returns `dynamic` (template-literal elements with substitutions,
 * always a per-document id tag, correctly skipped) and `unresolved` (any
 * `isr(...)` first argument this script cannot classify) so the caller can
 * report both instead of extraction silently dropping them.
 */
export const extractServiceCallSiteTags = (file, sf) => {
  const tags = new Set();
  const dynamic = [];
  const unresolved = [];

  const collectFromArrayLiteral = (arrayLiteral) => {
    for (const element of arrayLiteral.elements) {
      if (isStringLike(element)) {
        tags.add(element.text);
      } else if (ts.isTemplateExpression(element)) {
        dynamic.push({ file: toRelative(file), text: element.getText(sf) });
      } else {
        unresolved.push({ file: toRelative(file), text: element.getText(sf) });
      }
    }
  };

  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'isr' &&
      node.arguments[0]
    ) {
      const arg = node.arguments[0];
      if (isStringLike(arg)) {
        tags.add(arg.text);
      } else if (ts.isArrayLiteralExpression(arg)) {
        collectFromArrayLiteral(arg);
      } else if (!ts.isIdentifier(arg)) {
        unresolved.push({ file: toRelative(file), text: arg.getText(sf) });
      }
      // A bare identifier (e.g. `isr(tags, ...)`) is resolved via the
      // `tags: [...]` property scan below, not here.
    }

    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'tags' &&
      ts.isArrayLiteralExpression(node.initializer) &&
      node.initializer.elements.every(isStringLike)
    ) {
      collectFromArrayLiteral(node.initializer);
    }

    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { tags, dynamic, unresolved };
};

export const collectServiceTags = (files, parseFn = (f) => parse(f)) => {
  const tags = new Set();
  const dynamic = [];
  const unresolved = [];
  for (const file of files) {
    const result = extractServiceCallSiteTags(file, parseFn(file));
    for (const tag of result.tags) tags.add(tag);
    dynamic.push(...result.dynamic);
    unresolved.push(...result.unresolved);
  }
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

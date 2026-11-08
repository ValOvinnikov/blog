// Checks that every ISR tag literal passed to `isr(...)` across
// packages/service/src is registered in apps/web's `REVALIDATE_TAGS` map
// (apps/web/src/utils/revalidate-tags/revalidate-tags.ts) — the revalidation
// webhook's `_type` → tag lookup. A tag missing from that map's value union
// means a publish for that document type never purges it: the webhook has
// no per-tag Object.hasOwn miss to report, so this is the only guard against
// that failure class.
//
// This check trusts literals only. Each `isr(...)` call is read straight off
// its own file's AST, with no TypeScript program and no symbol lookup. The one
// name it resolves is a spread of a shared tag list: every list declared under
// packages/service/src/shared/cache-tags/ is read first and matched by its
// bare name, and two lists sharing a name fail the run, so a spread can never
// be checked against the wrong list. It still has to find the call in the first
// place, and does so by name: a call is recognized only when its callee is
// the bare identifier `isr`. An aliased import (`isr as buildCacheOptions`)
// or a property-access call (`ns.isr(...)`) is not matched at all, so such a
// call lands in none of the buckets below — it is silently neither checked
// nor reported. This holds today because nothing in packages/service/src
// aliases or namespaces the import; it is a deliberate limit, not an
// oversight, and re-checking it is the cost of adding either.
//
// Once a call is recognized, its first argument must be one of:
//   - a string literal, or an array literal of string literals — collected
//     as covered tags;
//   - a template literal with a substitution (e.g. `` `module:${id}` ``) —
//     a per-document tag appended at runtime, reported and skipped, never
//     registrable;
//   - inside an array literal, a spread of a shared tag list — an
//     `export const NAME = [...] as const` of string literals declared under
//     packages/service/src/shared/cache-tags/ — collected as that list's
//     tags. That folder is the one place a tag list is read by name;
//   - anything else at all (a bare identifier, a variable, any other spread,
//     a computed expression, a function call, …) — reported as unresolved
//     and the run fails. A loader that needs to pass a non-literal here must
//     be rewritten so its tags appear as a literal at the `isr(...)` call
//     site, or as a spread of a shared tag list.
// A zero-argument `isr()` call is likewise not matched — `isr`'s first
// parameter is mandatory, so this shape does not occur in practice.
//
// Run with `pnpm check:revalidate-tags-sync`. Read-only; exits 1 on any
// mismatch or unresolved call site.
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
const SHARED_TAG_LISTS_DIR = join(SERVICE_SRC_DIR, 'shared/cache-tags');

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

const unwrapAssertions = (node) => {
  let inner = node;
  while (ts.isAsExpression(inner) || ts.isSatisfiesExpression(inner)) {
    inner = inner.expression;
  }
  return inner;
};

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
      const objectLiteral = unwrapAssertions(node.initializer);
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

/**
 * Every top-level `const NAME = ['tag', ...] as const` whose elements are all
 * string literals, keyed by name — the shared tag lists a loader may spread
 * into its `isr(...)` array.
 */
export const extractSharedTagLists = (sf) => {
  const lists = new Map();
  for (const statement of sf.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        continue;
      }
      const initializer = unwrapAssertions(declaration.initializer);
      if (
        ts.isArrayLiteralExpression(initializer) &&
        initializer.elements.every(isStringLike)
      ) {
        lists.set(
          declaration.name.text,
          initializer.elements.map((element) => element.text),
        );
      }
    }
  }
  return lists;
};

// A relative-path formatter for reporting; keeps output stable across
// machines instead of leaking each contributor's absolute checkout path.
const toRelative = (file) => relative(repoRoot, file);

/**
 * Classifies a single `isr(...)` argument node — the whole first argument,
 * or one element of an array-literal first argument — into `target.tags`
 * (a string literal, or every tag of a spread shared tag list),
 * `target.dynamic` (a substituted template, a per-document runtime tag) or
 * `target.unresolved` (anything else, which fails the run).
 */
const classifyArgumentNode = (node, sf, fileRel, target, sharedLists) => {
  if (
    ts.isSpreadElement(node) &&
    ts.isIdentifier(node.expression) &&
    sharedLists.has(node.expression.text)
  ) {
    for (const tag of sharedLists.get(node.expression.text)) {
      target.tags.add(tag);
    }
  } else if (isStringLike(node)) {
    target.tags.add(node.text);
  } else if (ts.isTemplateExpression(node)) {
    target.dynamic.push({ file: fileRel, text: node.getText(sf) });
  } else {
    target.unresolved.push({ file: fileRel, text: node.getText(sf) });
  }
};

/**
 * Walks every `isr(...)` call in a single source file, classifying its first
 * argument (or, for an array-literal argument, each of its elements) into
 * `target` in place.
 */
const collectFromSourceFile = (sf, target, sharedLists) => {
  const fileRel = toRelative(sf.fileName);
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'isr' &&
      node.arguments[0]
    ) {
      const arg = node.arguments[0];
      if (ts.isArrayLiteralExpression(arg)) {
        for (const element of arg.elements) {
          classifyArgumentNode(element, sf, fileRel, target, sharedLists);
        }
      } else {
        classifyArgumentNode(arg, sf, fileRel, target, new Map());
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
};

const newTarget = () => ({ tags: new Set(), dynamic: [], unresolved: [] });

/**
 * Collects tags across every `isr(...)` call in an inline source string,
 * for fixture-based tests — no file I/O.
 */
export const collectTagsFromSource = (file, text, sharedLists = new Map()) => {
  const target = newTarget();
  collectFromSourceFile(parseSource(file, text), target, sharedLists);
  return target;
};

/**
 * Collects tags across every `isr(...)` call in each file in `files` (real
 * paths, read from disk).
 */
export const collectServiceTags = (files, sharedLists = new Map()) => {
  const target = newTarget();
  for (const file of files) {
    collectFromSourceFile(parse(file), target, sharedLists);
  }
  return target;
};

export const findMissingTags = (serviceTags, revalidateTagValues) =>
  [...serviceTags].filter((tag) => !revalidateTagValues.has(tag)).sort();

export const mergeSharedTagLists = (listsPerFile) => {
  const lists = new Map();
  for (const fileLists of listsPerFile) {
    for (const [name, tags] of fileLists) {
      if (lists.has(name)) {
        throw new Error(
          `Shared tag list ${name} is declared more than once under packages/service/src/shared/cache-tags/.`,
        );
      }
      lists.set(name, tags);
    }
  }
  return lists;
};

export const collectSharedTagLists = (files) =>
  mergeSharedTagLists(files.map((file) => extractSharedTagLists(parse(file))));

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
      'Found isr(...) call site(s) whose tag argument is not a string/array ' +
        'literal — rewrite the call to pass its tags as a literal directly, or ' +
        'spread a shared tag list from packages/service/src/shared/cache-tags/:',
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
  const sharedLists = collectSharedTagLists(
    listServiceSourceFiles(SHARED_TAG_LISTS_DIR),
  );
  const { tags, dynamic, unresolved } = collectServiceTags(files, sharedLists);
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

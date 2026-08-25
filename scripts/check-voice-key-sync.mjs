// Checks that the "voice" override vocabulary stays in sync across the four
// places that hand-duplicate it:
//   - apps/cms/src/schema-types/documents/settings/voice.ts
//     (the Sanity `settings_voice` schema's `defineField({ name: '...' })` calls)
//   - apps/admin/src/utils/voice-fields/voice-fields.ts
//     (`VOICE_FIELD_GROUPS`' field `key`s)
//   - apps/web/src/utils/apply-voice-overrides/apply-voice-overrides.ts
//     (`VOICE_OVERRIDE_PATHS`' object keys)
//   - packages/db/src/queries/site-config/upsert-site-config/upsert-site-config.ts
//     (`voiceOverridesSchema`'s `z.object({...})` property names)
//
// Nothing else catches one file drifting out of sync with the others, so
// this parses each as a TypeScript AST (the `typescript` package already in
// the repo — no new dep) and compares the extracted key sets.
//
// Run with `pnpm check:voice-sync`. Read-only; exits 1 on any mismatch.
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');

const CMS_FILE = join(
  repoRoot,
  'apps/cms/src/schema-types/documents/settings/voice.ts',
);
const ADMIN_FILE = join(
  repoRoot,
  'apps/admin/src/utils/voice-fields/voice-fields.ts',
);
const WEB_FILE = join(
  repoRoot,
  'apps/web/src/utils/apply-voice-overrides/apply-voice-overrides.ts',
);
const DB_FILE = join(
  repoRoot,
  'packages/db/src/queries/site-config/upsert-site-config/upsert-site-config.ts',
);

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

const stringValue = (node) =>
  node && ts.isStringLiteralLike(node) ? node.text : null;

const findLocalDeclaration = (sf, name) => {
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === name) return decl;
    }
  }
  return null;
};

// Every `defineField({ name: '...' })` call's `name` string literal.
export const extractCmsKeys = (sf) => {
  const keys = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'defineField' &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      for (const prop of node.arguments[0].properties) {
        if (ts.isPropertyAssignment(prop) && prop.name.getText(sf) === 'name') {
          const value = stringValue(prop.initializer);
          if (value) keys.push(value);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return keys;
};

// Every `key: '...'` string literal inside VOICE_FIELD_GROUPS' nested
// `fields` arrays — the runtime array, not the `TVoiceOverrideKey` union
// alias, since a type alias's members aren't reliably distinguishable from
// any other string-literal union via the AST alone.
export const extractAdminKeys = (sf) => {
  const init = findLocalDeclaration(sf, 'VOICE_FIELD_GROUPS')?.initializer;
  if (!init || !ts.isArrayLiteralExpression(init)) return [];

  const keys = [];
  for (const group of init.elements) {
    if (!ts.isObjectLiteralExpression(group)) continue;
    const fieldsProp = group.properties.find(
      (p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === 'fields',
    );
    if (
      !fieldsProp ||
      !ts.isPropertyAssignment(fieldsProp) ||
      !ts.isArrayLiteralExpression(fieldsProp.initializer)
    )
      continue;
    for (const field of fieldsProp.initializer.elements) {
      if (!ts.isObjectLiteralExpression(field)) continue;
      const keyProp = field.properties.find(
        (p) => ts.isPropertyAssignment(p) && p.name.getText(sf) === 'key',
      );
      const value =
        keyProp && ts.isPropertyAssignment(keyProp)
          ? stringValue(keyProp.initializer)
          : null;
      if (value) keys.push(value);
    }
  }
  return keys;
};

// Top-level property names of the VOICE_OVERRIDE_PATHS object literal.
export const extractWebKeys = (sf) => {
  const init = findLocalDeclaration(sf, 'VOICE_OVERRIDE_PATHS')?.initializer;
  if (!init || !ts.isObjectLiteralExpression(init)) return [];

  const keys = [];
  for (const prop of init.properties) {
    if (
      !ts.isPropertyAssignment(prop) &&
      !ts.isShorthandPropertyAssignment(prop)
    )
      continue;
    const name = prop.name;
    if (ts.isIdentifier(name) || ts.isStringLiteral(name)) keys.push(name.text);
  }
  return keys;
};

// Property names of the object literal passed to `z.object({...})` in
// `voiceOverridesSchema = z.object({...}).transform(fn)`.
export const extractDbKeys = (sf) => {
  const init = findLocalDeclaration(sf, 'voiceOverridesSchema')?.initializer;
  if (!init || !ts.isCallExpression(init)) return [];
  if (
    !ts.isPropertyAccessExpression(init.expression) ||
    init.expression.name.text !== 'transform'
  )
    return [];

  const objectCall = init.expression.expression;
  if (
    !ts.isCallExpression(objectCall) ||
    !ts.isPropertyAccessExpression(objectCall.expression) ||
    objectCall.expression.name.text !== 'object' ||
    !objectCall.arguments[0] ||
    !ts.isObjectLiteralExpression(objectCall.arguments[0])
  )
    return [];

  const keys = [];
  for (const prop of objectCall.arguments[0].properties) {
    if (
      !ts.isPropertyAssignment(prop) &&
      !ts.isShorthandPropertyAssignment(prop)
    )
      continue;
    const name = prop.name;
    if (ts.isIdentifier(name) || ts.isStringLiteral(name)) keys.push(name.text);
  }
  return keys;
};

// Compares N labelled key lists and reports, per label, which keys present in
// at least one other list are missing from it.
export const compareKeySets = (sources) => {
  const allKeys = new Set(sources.flatMap((s) => s.keys));
  const missing = {};
  for (const key of allKeys) {
    for (const { label, keys } of sources) {
      if (!keys.includes(key)) {
        missing[label] ??= [];
        missing[label].push(key);
      }
    }
  }
  return { inSync: Object.keys(missing).length === 0, missing, allKeys };
};

const formatReport = (missing, sources) => {
  const lines = ['Voice-override keys are out of sync:'];
  for (const [label, keys] of Object.entries(missing)) {
    lines.push(`  ${label} is missing: ${[...keys].sort().join(', ')}`);
  }
  lines.push(
    '',
    'Every voice-override key must exist in all files:',
    ...sources.map((s) => `  - ${relative(repoRoot, s.file)}`),
  );
  return lines.join('\n');
};

export const SOURCES = [
  { label: 'cms', file: CMS_FILE, extract: extractCmsKeys },
  { label: 'admin', file: ADMIN_FILE, extract: extractAdminKeys },
  { label: 'web', file: WEB_FILE, extract: extractWebKeys },
  { label: 'db', file: DB_FILE, extract: extractDbKeys },
];

const main = () => {
  const sources = SOURCES.map(({ label, file, extract }) => ({
    label,
    file,
    keys: extract(parse(file)),
  }));

  const { inSync, missing, allKeys } = compareKeySets(sources);

  if (!inSync) {
    console.error(formatReport(missing, sources));
    process.exit(1);
  }

  console.log(
    `Voice-override keys are in sync across cms/admin/web/db (${allKeys.size} keys).`,
  );
};

// Only run when invoked as a script — the fixture tests import this module.
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import {
  ENV_OBJECT_NAME,
  EQUALITY_OPERATORS,
  PROCESS_NAME,
  PROTOCOL_ATTRIBUTE_KEYS,
  ROLE_QUERY_CALLEES,
  SANITY_TYPE_KEY,
  STUB_ENV_CALLEE,
} from '../configs/eslint/literal-vocabulary.js';
import {
  listTouchedSourceFiles,
  readBaseVersion,
  repoRoot,
  resolveBase,
} from './touched-files.mjs';

const EXEMPT_PATHS = [
  /\/sanity\/generated\//,
  /^packages\/studio\/migrations\//,
];
const CLASS_HELPERS = new Set([
  'cn',
  'clsx',
  'cx',
  'tv',
  'cva',
  'twMerge',
  'twJoin',
]);
const MODULE_PATH_CALLEES = new Set([
  'blogPackageAlias',
  'require',
  'mock',
  'doMock',
  'unmock',
  'importActual',
  'importMock',
  'resolve',
]);
const TEST_TITLE_CALLEES = new Set([
  'describe',
  'it',
  'test',
  'bench',
  'suite',
]);
const TEST_TABLE_METHODS = new Set(['each', 'for']);
const GROQD_TYPED_METHODS = new Set([
  'field',
  'filterBy',
  'filterByType',
  'order',
]);
const ISR_CALLEE = 'isr';
const MAX_LISTED_LOCATIONS = 3;

const isExemptPath = (file) => EXEMPT_PATHS.some((re) => re.test(file));

const calleeName = (expression) => {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }
  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text;
  }
  return undefined;
};

const isFirstArgumentOf = (node, names) => {
  const { parent } = node;
  return (
    ts.isCallExpression(parent) &&
    parent.arguments[0] === node &&
    (parent.expression.kind === ts.SyntaxKind.ImportKeyword ||
      names.has(calleeName(parent.expression)))
  );
};

const rootName = (expression) => {
  let current = expression;
  while (ts.isPropertyAccessExpression(current)) {
    current = current.expression;
  }
  return ts.isIdentifier(current) ? current.text : undefined;
};

const isTestTitle = (node) => {
  const { parent } = node;
  return (
    ts.isCallExpression(parent) &&
    parent.arguments[0] === node &&
    TEST_TITLE_CALLEES.has(rootName(parent.expression))
  );
};

const isTestTable = (expression) =>
  ts.isPropertyAccessExpression(expression) &&
  TEST_TABLE_METHODS.has(expression.name.text) &&
  TEST_TITLE_CALLEES.has(rootName(expression.expression));

const isTestTableTitle = (node) => {
  const { parent } = node;
  if (ts.isTaggedTemplateExpression(parent)) {
    return parent.template === node && isTestTable(parent.tag);
  }
  if (!ts.isCallExpression(parent) || parent.arguments[0] !== node) {
    return false;
  }
  const table = parent.expression;
  return (
    (ts.isCallExpression(table) && isTestTable(table.expression)) ||
    (ts.isTaggedTemplateExpression(table) && isTestTable(table.tag))
  );
};

const isInsideClassOrJsxAttribute = (node) => {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isJsxAttribute(current)) {
      return true;
    }
    if (
      ts.isCallExpression(current) &&
      CLASS_HELPERS.has(calleeName(current.expression))
    ) {
      return true;
    }
  }
  return false;
};

const isEnvObject = (expression) =>
  (ts.isIdentifier(expression) && expression.text === ENV_OBJECT_NAME) ||
  (ts.isPropertyAccessExpression(expression) &&
    expression.name.text === ENV_OBJECT_NAME &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === PROCESS_NAME);

const isEnvRead = (expression) =>
  (ts.isPropertyAccessExpression(expression) ||
    ts.isElementAccessExpression(expression)) &&
  isEnvObject(expression.expression);

const isEnvComparisonOperand = ({ parent }) =>
  ts.isBinaryExpression(parent) &&
  EQUALITY_OPERATORS.has(ts.tokenToString(parent.operatorToken.kind)) &&
  (isEnvRead(parent.left) || isEnvRead(parent.right));

const isEnvReadKey = (node) => {
  const { parent } = node;
  return (
    ts.isElementAccessExpression(parent) &&
    parent.argumentExpression === node &&
    isEnvObject(parent.expression)
  );
};

const isStubEnvArgument = ({ parent }) =>
  ts.isCallExpression(parent) &&
  ts.isPropertyAccessExpression(parent.expression) &&
  parent.expression.name.text === STUB_ENV_CALLEE;

const isProtocolAttributeValue = ({ parent }) =>
  ts.isPropertyAssignment(parent) &&
  (ts.isIdentifier(parent.name) || ts.isStringLiteral(parent.name)) &&
  PROTOCOL_ATTRIBUTE_KEYS.has(parent.name.text);

// Sanity `_type` names and literal types are checked against the generated types, so they cannot drift.
const isSanityTypeValue = ({ parent }) =>
  ts.isPropertyAssignment(parent) &&
  (ts.isIdentifier(parent.name) || ts.isStringLiteral(parent.name)) &&
  parent.name.text === SANITY_TYPE_KEY;

// groqd checks its typed builders' arguments against the generated Sanity types, so they cannot drift.
const isGroqdTypedArgument = ({ parent }) =>
  ts.isCallExpression(parent) &&
  ts.isPropertyAccessExpression(parent.expression) &&
  GROQD_TYPED_METHODS.has(parent.expression.name.text);

// `check:revalidate-tags-sync` checks every `isr(...)` tag against the revalidation webhook's map.
const isIsrTag = (node) => {
  const { parent } = node;
  const tagArgument = ts.isArrayLiteralExpression(parent) ? parent : node;
  const call = tagArgument.parent;
  return (
    ts.isCallExpression(call) &&
    call.arguments[0] === tagArgument &&
    ts.isIdentifier(call.expression) &&
    call.expression.text === ISR_CALLEE
  );
};

const isExemptLiteral = (node) => {
  const { parent } = node;
  return (
    node.text.trim() === '' ||
    /\s/.test(node.text) ||
    ts.isExpressionStatement(parent) ||
    ts.isImportDeclaration(parent) ||
    ts.isExportDeclaration(parent) ||
    ts.isExternalModuleReference(parent) ||
    ts.isModuleDeclaration(parent) ||
    ts.isLiteralTypeNode(parent) ||
    (parent.name === node && !ts.isElementAccessExpression(parent)) ||
    isFirstArgumentOf(node, MODULE_PATH_CALLEES) ||
    isTestTitle(node) ||
    isTestTableTitle(node) ||
    isFirstArgumentOf(node, ROLE_QUERY_CALLEES) ||
    isInsideClassOrJsxAttribute(node) ||
    isEnvComparisonOperand(node) ||
    isEnvReadKey(node) ||
    isStubEnvArgument(node) ||
    isProtocolAttributeValue(node) ||
    isSanityTypeValue(node) ||
    isGroqdTypedArgument(node) ||
    isIsrTag(node)
  );
};

export const collectLiterals = (file, text) => {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const found = [];
  const visit = (node) => {
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      !isExemptLiteral(node)
    ) {
      const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
      found.push({ value: node.text, line: line + 1 });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
};

const countValues = (literals) => {
  const counts = new Map();
  for (const { value } of literals) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
};

export const addedValues = (baseText, currentLiterals, file) => {
  const before = countValues(baseText ? collectLiterals(file, baseText) : []);
  return [...countValues(currentLiterals)]
    .filter(([value, count]) => count > (before.get(value) ?? 0))
    .map(([value]) => value);
};

const readWorkspaces = () =>
  ['apps', 'packages'].flatMap((group) =>
    readdirSync(join(repoRoot, group))
      .map((name) => `${group}/${name}`)
      .filter((dir) => existsSync(join(repoRoot, dir, 'package.json')))
      .map((dir) => {
        const pkg = JSON.parse(
          readFileSync(join(repoRoot, dir, 'package.json'), 'utf8'),
        );
        return {
          dir,
          name: pkg.name,
          deps: Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }),
        };
      }),
  );

export const scopeOf = (workspaces, dir) => {
  const byName = new Map(workspaces.map((w) => [w.name, w]));
  const scope = new Set();
  const pending = [workspaces.find((w) => w.dir === dir)];
  while (pending.length > 0) {
    const workspace = pending.pop();
    if (workspace && !scope.has(workspace.dir)) {
      scope.add(workspace.dir);
      pending.push(...workspace.deps.map((dep) => byName.get(dep)));
    }
  }
  return scope;
};

const workspaceDirOf = (file) => /^(?:apps|packages)\/[^/]+/.exec(file)?.[0];

const listWorkspaceSources = (dir) =>
  execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '--', dir],
    { cwd: repoRoot, encoding: 'utf8' },
  )
    .split('\n')
    .filter((file) => /\.tsx?$/.test(file) && !file.endsWith('.d.ts'))
    .filter((file) => !isExemptPath(file) && existsSync(join(repoRoot, file)));

const buildCorpus = (dir) => {
  const byValue = new Map();
  for (const file of listWorkspaceSources(dir)) {
    const text = readFileSync(join(repoRoot, file), 'utf8');
    for (const { value, line } of collectLiterals(file, text)) {
      byValue.set(value, [...(byValue.get(value) ?? []), `${file}:${line}`]);
    }
  }
  return byValue;
};

const formatLocations = (locations) => {
  const listed = locations.slice(0, MAX_LISTED_LOCATIONS).join(', ');
  const more = locations.length - MAX_LISTED_LOCATIONS;
  return more > 0 ? `${listed} and ${more} more` : listed;
};

const main = () => {
  const base = resolveBase();
  if (!base) {
    console.log(
      'No origin/main to diff against; skipping the duplicate-literal check.',
    );
    return;
  }
  const workspaces = readWorkspaces();
  const apps = workspaces.filter((w) => w.dir.startsWith('apps/'));
  const corpora = new Map();
  const corpusOf = (dir) => {
    if (!corpora.has(dir)) {
      corpora.set(dir, buildCorpus(dir));
    }
    return corpora.get(dir);
  };
  const failures = [];
  const notes = [];
  for (const file of listTouchedSourceFiles(base)) {
    const workspace = workspaceDirOf(file);
    if (!workspace || isExemptPath(file)) {
      continue;
    }
    const scope = scopeOf(workspaces, workspace);
    const literals = collectLiterals(
      file,
      readFileSync(join(repoRoot, file), 'utf8'),
    );
    for (const value of addedValues(
      readBaseVersion(base, file),
      literals,
      file,
    )) {
      const here = literals
        .filter((l) => l.value === value)
        .map((l) => `${file}:${l.line}`);
      const elsewhere = [...scope]
        .flatMap((dir) => corpusOf(dir).get(value) ?? [])
        .filter((location) => !location.startsWith(`${file}:`));
      const sameFile = here.length > 1 ? here.slice(1) : [];
      if (elsewhere.length > 0 || sameFile.length > 0) {
        failures.push(
          `${here[0]} adds ${JSON.stringify(value)}, already at ${formatLocations([...sameFile, ...elsewhere])}`,
        );
        continue;
      }
      const crossApp = apps
        .filter((app) => !scope.has(app.dir))
        .flatMap((app) => corpusOf(app.dir).get(value) ?? []);
      if (crossApp.length > 0) {
        notes.push(
          `${here[0]} adds ${JSON.stringify(value)}, also in another app at ${formatLocations(crossApp)}`,
        );
      }
    }
  }
  for (const note of notes) {
    console.log(`note: ${note}`);
  }
  if (failures.length > 0) {
    console.error(
      `A literal this diff adds already exists — extract it into one const (CLAUDE.md "Reuse before you create"):\n${failures.map((f) => `  ${f}`).join('\n')}`,
    );
    process.exit(1);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

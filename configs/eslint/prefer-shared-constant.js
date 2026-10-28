import { readFileSync } from 'node:fs';

import {
  ATTRIBUTE_NAME_CALLEES,
  ENV_OBJECT_NAME,
  EQUALITY_OPERATORS,
  PROCESS_NAME,
} from './literal-vocabulary.js';

const INDEX_URL = new URL(
  '../../packages/config/const-index.json',
  import.meta.url,
);

const WORKSPACES_BELOW_CONFIG = new Set([
  'packages/utils',
  'packages/insight',
  'packages/email',
]);
const DB_CONSUMERS = new Set([
  'packages/db',
  'packages/auth',
  'apps/web',
  'apps/platform',
  'apps/worker',
]);
const EXEMPT_NUMBERS = new Set([0, 1, -1]);
const COMPARISON_OPERATORS = new Set([
  '===',
  '!==',
  '==',
  '!=',
  '<',
  '<=',
  '>',
  '>=',
]);
const EQUALITY_MATCHERS = new Set(['toBe', 'toEqual', 'toStrictEqual']);
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
  'require',
  'mock',
  'doMock',
  'unmock',
  'importActual',
  'importMock',
  'resolve',
]);
const MAX_LISTED_CONSTS = 3;

const readIndex = () => {
  try {
    return JSON.parse(readFileSync(INDEX_URL, 'utf8'));
  } catch {
    return { strings: {}, numbers: {} };
  }
};

const workspaceOf = (filename) =>
  /(?:^|\/)((?:apps|packages)\/[^/]+)\//.exec(
    filename.replaceAll('\\', '/'),
  )?.[1];

const isReachable = (entry, workspace) => {
  if (entry.scope === 'config') {
    return !WORKSPACES_BELOW_CONFIG.has(workspace);
  }
  if (entry.scope === 'db') {
    return DB_CONSUMERS.has(workspace);
  }
  return entry.scope === `app:${workspace.replace('apps/', '')}`;
};

const calleeName = (callee) => {
  if (callee.type === 'Identifier') {
    return callee.name;
  }
  if (callee.type === 'MemberExpression' && !callee.computed) {
    return callee.property.name;
  }
  return undefined;
};

const isModulePath = (node) => {
  const { parent } = node;
  if (
    [
      'ImportDeclaration',
      'ExportNamedDeclaration',
      'ExportAllDeclaration',
      'ImportExpression',
    ].includes(parent.type) ||
    parent.type === 'TSExternalModuleReference' ||
    parent.type === 'TSModuleDeclaration'
  ) {
    return true;
  }
  return (
    parent.type === 'CallExpression' &&
    parent.arguments[0] === node &&
    MODULE_PATH_CALLEES.has(calleeName(parent.callee))
  );
};

const isKey = (node) => {
  const { parent } = node;
  return (
    (parent.type === 'Property' ||
      parent.type === 'TSPropertySignature' ||
      parent.type === 'PropertyDefinition') &&
    parent.key === node &&
    !parent.computed
  );
};

export const isClassString = (node) => {
  for (let current = node.parent; current; current = current.parent) {
    if (current.type === 'JSXAttribute') {
      return ['className', 'class'].includes(current.name.name);
    }
    if (
      current.type === 'CallExpression' &&
      CLASS_HELPERS.has(calleeName(current.callee))
    ) {
      return true;
    }
  }
  return false;
};

const isJsxChild = (node) =>
  node.parent.type === 'JSXExpressionContainer' &&
  node.parent.parent.type === 'JSXElement';

const isAttributeName = (node) => {
  const { parent } = node;
  return (
    parent.type === 'CallExpression' &&
    parent.arguments[0] === node &&
    ATTRIBUTE_NAME_CALLEES.has(calleeName(parent.callee))
  );
};

const isEnvObject = (expression) =>
  (expression.type === 'Identifier' && expression.name === ENV_OBJECT_NAME) ||
  (expression.type === 'MemberExpression' &&
    !expression.computed &&
    expression.property.name === ENV_OBJECT_NAME &&
    expression.object.type === 'Identifier' &&
    expression.object.name === PROCESS_NAME);

const isEnvRead = (expression) =>
  expression.type === 'MemberExpression' && isEnvObject(expression.object);

export const isEnvComparisonOperand = ({ parent }) =>
  parent.type === 'BinaryExpression' &&
  EQUALITY_OPERATORS.has(parent.operator) &&
  (isEnvRead(parent.left) || isEnvRead(parent.right));

const isExemptString = (node) =>
  isEnvComparisonOperand(node) ||
  node.parent.type === 'ExpressionStatement' ||
  isModulePath(node) ||
  isAttributeName(node) ||
  isKey(node) ||
  isClassString(node) ||
  isJsxChild(node);

const isStatusProperty = (parent) =>
  parent.type === 'Property' &&
  ((parent.key.type === 'Identifier' && parent.key.name === 'status') ||
    parent.key.value === 'status');

const isStatusMatcherArg = (node) => {
  const { parent } = node;
  if (
    parent.type !== 'CallExpression' ||
    !EQUALITY_MATCHERS.has(calleeName(parent.callee))
  ) {
    return false;
  }
  let subject = parent.callee.object;
  while (subject?.type === 'MemberExpression') {
    subject = subject.object;
  }
  const [actual] = subject?.type === 'CallExpression' ? subject.arguments : [];
  return (
    actual?.type === 'MemberExpression' && actual.property.name === 'status'
  );
};

const isMeaningfulNumber = (node) => {
  const { parent } = node;
  return (
    isStatusProperty(parent) ||
    (parent.type === 'BinaryExpression' &&
      COMPARISON_OPERATORS.has(parent.operator)) ||
    (parent.type === 'SwitchCase' && parent.test === node) ||
    isStatusMatcherArg(node)
  );
};

const describeEntries = (entries) => {
  const listed = entries
    .slice(0, MAX_LISTED_CONSTS)
    .map(({ ref, from }) => `${ref} (${from})`);
  const more = entries.length - listed.length;
  return more > 0
    ? `${listed.join(' or ')} or ${more} more`
    : listed.join(' or ');
};

export const createPreferSharedConstantRule = (index) => ({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Use the shared const instead of writing its value as a literal.',
    },
    schema: [],
    messages: {
      preferSharedConstant:
        '{{value}} duplicates {{consts}} — use the const instead of the literal (packages/config/CONSTANTS.md lists every one).',
    },
  },
  create(context) {
    const filename = context.filename.replaceAll('\\', '/');
    const workspace = workspaceOf(filename);
    const resolvedIndex = typeof index === 'function' ? index() : index;
    if (!workspace) {
      return {};
    }
    const matches = (bucket, value) =>
      (resolvedIndex[bucket][String(value)] ?? []).filter(
        (entry) =>
          isReachable(entry, workspace) && !filename.endsWith(`/${entry.file}`),
      );
    const definesConsts = [
      ...Object.values(resolvedIndex.strings),
      ...Object.values(resolvedIndex.numbers),
    ]
      .flat()
      .some((entry) => filename.endsWith(`/${entry.file}`));
    if (definesConsts) {
      return {};
    }
    const report = (node, raw, entries) => {
      if (entries.length > 0) {
        context.report({
          node,
          messageId: 'preferSharedConstant',
          data: { value: raw, consts: describeEntries(entries) },
        });
      }
    };
    return {
      Literal(node) {
        if (typeof node.value === 'string' && !isExemptString(node)) {
          report(node, `'${node.value}'`, matches('strings', node.value));
        }
        if (
          typeof node.value === 'number' &&
          !EXEMPT_NUMBERS.has(node.value) &&
          isMeaningfulNumber(node)
        ) {
          report(node, node.raw, matches('numbers', node.value));
        }
      },
      TemplateLiteral(node) {
        if (node.expressions.length === 0 && !isExemptString(node)) {
          const value = node.quasis[0].value.cooked;
          if (value !== null) {
            report(node, `'${value}'`, matches('strings', value));
          }
        }
      },
    };
  },
});

let cachedIndex;
export const preferSharedConstantRule = createPreferSharedConstantRule(
  () => (cachedIndex ??= readIndex()),
);

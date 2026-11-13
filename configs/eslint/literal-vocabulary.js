const PROTOCOL_ATTRIBUTE_KEYS = new Set(['sameSite']);
const PROTOCOL_ATTRIBUTE_VALUES = new Map([
  ['target', new Set(['_blank'])],
  ['type', new Set(['button', 'submit', 'reset'])],
]);
const EQUALITY_OPERATORS = new Set(['===', '!==', '==', '!=']);
const ENV_OBJECT_NAME = 'env';
const PROCESS_NAME = 'process';
const STUB_ENV_CALLEE = 'stubEnv';
const ROLE_QUERY_CALLEES = new Set([
  'getByRole',
  'getAllByRole',
  'queryByRole',
  'queryAllByRole',
  'findByRole',
  'findAllByRole',
]);
export const ATTRIBUTE_NAME_CALLEES = new Set([
  'getAttribute',
  'hasAttribute',
  'removeAttribute',
  'setAttribute',
  'toggleAttribute',
  'toHaveAttribute',
]);

const isEnvObject = (expression) =>
  (expression.type === 'Identifier' && expression.name === ENV_OBJECT_NAME) ||
  (expression.type === 'MemberExpression' &&
    !expression.computed &&
    expression.property.name === ENV_OBJECT_NAME &&
    expression.object.type === 'Identifier' &&
    expression.object.name === PROCESS_NAME);

const isEnvRead = (expression) =>
  expression.type === 'MemberExpression' && isEnvObject(expression.object);

const isEnvComparisonOperand = ({ parent }) =>
  parent.type === 'BinaryExpression' &&
  EQUALITY_OPERATORS.has(parent.operator) &&
  (isEnvRead(parent.left) || isEnvRead(parent.right));

const isStubEnvArgument = ({ parent }) =>
  parent.type === 'CallExpression' &&
  parent.callee.type === 'MemberExpression' &&
  parent.callee.property.name === STUB_ENV_CALLEE;

const isRoleQueryArgument = ({ parent }) =>
  parent.type === 'CallExpression' &&
  ((parent.callee.type === 'Identifier' &&
    ROLE_QUERY_CALLEES.has(parent.callee.name)) ||
    (parent.callee.type === 'MemberExpression' &&
      ROLE_QUERY_CALLEES.has(parent.callee.property.name)));

const protocolAttributeName = (node) => {
  const value =
    node.parent.type === 'AssignmentPattern' && node.parent.right === node
      ? node.parent
      : node;
  const { parent } = value;
  if (parent.type === 'JSXAttribute') {
    return parent.name.name;
  }
  if (
    parent.type === 'Property' &&
    parent.value === value &&
    !parent.computed
  ) {
    return parent.key.name ?? parent.key.value;
  }
  return undefined;
};

const isProtocolAttributeValue = (node) => {
  const name = protocolAttributeName(node);
  return (
    PROTOCOL_ATTRIBUTE_KEYS.has(name) ||
    PROTOCOL_ATTRIBUTE_VALUES.get(name)?.has(node.value) === true
  );
};

const isLiteralType = ({ parent }) => parent.type === 'TSLiteralType';

export const isStandardVocabulary = (node) =>
  isEnvComparisonOperand(node) ||
  isStubEnvArgument(node) ||
  isRoleQueryArgument(node) ||
  isProtocolAttributeValue(node) ||
  isLiteralType(node);

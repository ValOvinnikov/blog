const PRIMITIVES_MODULE = '@blog/utils/primitives';
const EXEMPT_WORKSPACES = new Set(['packages/utils', 'packages/insight']);
const STRICT_EQUALITY = new Set(['===', '!==']);
const EMPTINESS_OPERATORS = new Set(['===', '!==', '>']);
const MIRRORED_OPERATOR = { '===': '===', '!==': '!==', '>': '<', '<': '>' };

const workspaceOf = (filename) =>
  /(?:^|\/)((?:apps|packages)\/[^/]+)\//.exec(filename)?.[1];

const isGenerated = (filename) => filename.includes('/sanity/generated/');

const unwrapChain = (node) =>
  node.type === 'ChainExpression' ? node.expression : node;

const isUndefinedIdentifier = (node) =>
  node.type === 'Identifier' && node.name === 'undefined';

const isNullLiteral = (node) => node.type === 'Literal' && node.value === null;

const isStringLiteral = (node) =>
  node.type === 'Literal' && node.value === 'string';

const isTypeofOperand = (node) =>
  node.type === 'UnaryExpression' && node.operator === 'typeof';

const isZero = (node) => node.type === 'Literal' && node.value === 0;

const isStringValue = (node) =>
  (node.type === 'Literal' && typeof node.value === 'string') ||
  node.type === 'TemplateLiteral';

const isLengthRead = (node) => {
  const member = unwrapChain(node);
  return (
    member.type === 'MemberExpression' &&
    !member.computed &&
    member.property.name === 'length' &&
    !isStringValue(member.object)
  );
};

const pairOf = ({ left, right, operator }, isMarker) => {
  if (isMarker(right)) {
    return { subject: left, operator };
  }
  if (isMarker(left)) {
    return { subject: right, operator: MIRRORED_OPERATOR[operator] };
  }
  return undefined;
};

const findHelper = (node) => {
  if (STRICT_EQUALITY.has(node.operator)) {
    if (pairOf(node, isUndefinedIdentifier)) {
      return 'isUndefined';
    }
    if (pairOf(node, isNullLiteral)) {
      return 'isNull';
    }
    const typeofPair = pairOf(node, isStringLiteral);
    if (typeofPair && isTypeofOperand(typeofPair.subject)) {
      return 'isString';
    }
  }
  const lengthPair = pairOf(node, isZero);
  if (
    lengthPair &&
    EMPTINESS_OPERATORS.has(lengthPair.operator) &&
    isLengthRead(lengthPair.subject)
  ) {
    return 'hasLength';
  }
  return undefined;
};

export const preferUtilsPrimitiveRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Use the @blog/utils/primitives helper instead of the raw comparison it wraps.',
    },
    schema: [],
    messages: {
      preferUtilsPrimitive:
        "Use {{helper}}() from '{{module}}' instead of the raw comparison.",
    },
  },
  create(context) {
    const filename = context.filename.replaceAll('\\', '/');
    const workspace = workspaceOf(filename);
    if (
      !workspace ||
      EXEMPT_WORKSPACES.has(workspace) ||
      isGenerated(filename)
    ) {
      return {};
    }
    return {
      BinaryExpression(node) {
        const helper = findHelper(node);
        if (helper) {
          context.report({
            node,
            messageId: 'preferUtilsPrimitive',
            data: { helper, module: PRIMITIVES_MODULE },
          });
        }
      },
    };
  },
};

const FLAGGED_MEMBER_NAMES = new Set(['className', 'classList', 'toHaveClass']);
const CLASS_ATTRIBUTE_METHODS = new Set(['toHaveAttribute', 'getAttribute']);

function isFlaggedMember(node) {
  return (
    !node.computed &&
    node.property.type === 'Identifier' &&
    FLAGGED_MEMBER_NAMES.has(node.property.name)
  );
}

function isClassAttributeCall(node) {
  const { callee } = node;
  if (callee.type !== 'MemberExpression' || callee.computed) {
    return false;
  }
  if (
    callee.property.type !== 'Identifier' ||
    !CLASS_ATTRIBUTE_METHODS.has(callee.property.name)
  ) {
    return false;
  }
  const [firstArg] = node.arguments;
  return firstArg?.type === 'Literal' && firstArg.value === 'class';
}

/**
 * Bans asserting a DOM class in a test — `toHaveClass`, `toHaveAttribute('class', …)`,
 * `getAttribute('class')`, and reads of `.className`/`.classList` — per
 * `testing-practices` → "What not to test".
 */
export const noClassAssertionsRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Never assert a class in a test — assert the semantic observable instead.',
    },
    schema: [],
    messages: {
      noClassAssertion:
        'Never assert a class in a test — assert the semantic observable (role, ARIA state, text) or cover styling in a story with no-tests-needed (testing-practices → "What not to test").',
    },
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (isFlaggedMember(node)) {
          context.report({
            node: node.property,
            messageId: 'noClassAssertion',
          });
        }
      },
      CallExpression(node) {
        if (isClassAttributeCall(node)) {
          context.report({ node, messageId: 'noClassAssertion' });
        }
      },
    };
  },
};

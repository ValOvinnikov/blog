const QUERY_NAME = /^(get|query|find)(All)?By/;
const USER_OBJECTS = new Set(['user', 'userEvent']);
const BARE_CALLEES = new Set(['expect', 'fireEvent']);

function unwrapAwait(node) {
  return node.type === 'AwaitExpression' ? node.argument : node;
}

function isMember(node) {
  return node.type === 'MemberExpression' && !node.computed;
}

function isQuery(node) {
  const call = unwrapAwait(node);
  if (call.type !== 'CallExpression' || !isMember(call.callee)) {
    return false;
  }
  const { object, property } = call.callee;
  if (property.type !== 'Identifier' || !QUERY_NAME.test(property.name)) {
    return false;
  }
  if (object.type === 'Identifier') {
    return object.name === 'screen';
  }
  return (
    object.type === 'CallExpression' &&
    object.callee.type === 'Identifier' &&
    object.callee.name === 'within'
  );
}

function isHostCall(callee) {
  if (callee.type === 'Identifier') {
    return BARE_CALLEES.has(callee.name);
  }
  return (
    isMember(callee) &&
    callee.object.type === 'Identifier' &&
    (USER_OBJECTS.has(callee.object.name) || callee.object.name === 'fireEvent')
  );
}

export const noNestedQueryRule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Bind a Testing Library query to a const before passing it to expect or an interaction.',
    },
    schema: [],
    messages: {
      noNestedQuery:
        'Bind the query to a const and pass the name — never nest it in expect(…), user.<method>(…) or fireEvent.<method>(…) (testing-practices → "Name the element, then use the name").',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isHostCall(node.callee)) {
          return;
        }
        for (const arg of node.arguments) {
          if (isQuery(arg)) {
            context.report({ node: arg, messageId: 'noNestedQuery' });
          }
        }
      },
    };
  },
};

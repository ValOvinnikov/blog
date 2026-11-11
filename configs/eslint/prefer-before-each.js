const CASE_NAMES = new Set(['it', 'test']);
const CASE_MODIFIERS = new Set(['only', 'skip', 'concurrent', 'fails']);
const RENDER_NAMES = new Set(['render', 'renderElement', 'renderWithIntl']);
const REPEATED_RENDER_THRESHOLD = 3;

function isFunction(node) {
  return (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression' ||
    node.type === 'FunctionDeclaration'
  );
}

function isCaseCallee(callee) {
  if (callee.type === 'Identifier') {
    return CASE_NAMES.has(callee.name);
  }
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object.type === 'Identifier' &&
    CASE_NAMES.has(callee.object.name) &&
    callee.property.type === 'Identifier' &&
    CASE_MODIFIERS.has(callee.property.name)
  );
}

function caseBody(node) {
  if (node.type !== 'CallExpression' || !isCaseCallee(node.callee)) {
    return undefined;
  }
  const callback = node.arguments.find(isFunction);
  return callback?.body.type === 'BlockStatement' ? callback.body : undefined;
}

function isUserEventSetup(node) {
  const { callee } = node;
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'userEvent' &&
    callee.property.type === 'Identifier' &&
    callee.property.name === 'setup'
  );
}

function isRenderCall(node) {
  return (
    node.callee.type === 'Identifier' &&
    RENDER_NAMES.has(node.callee.name) &&
    node.arguments.length > 0
  );
}

const normalise = (text) => text.replace(/\s+/g, ' ');

function addTo(map, key, value) {
  const existing = map.get(key);
  if (existing) {
    existing.push(value);
  } else {
    map.set(key, [value]);
  }
}

export const preferBeforeEachRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Move arrangement repeated across test cases into beforeEach.',
    },
    schema: [],
    messages: {
      repeatedOpening:
        '{{count}} cases in this describe open with the same statement — move it into the describe\'s beforeEach (testing-practices → "Repeated arrangement goes in beforeEach").',
      setupInCase:
        'Set up userEvent once in beforeEach (`user = userEvent.setup()`), never inside a case (testing-practices → "Interaction is userEvent, set up in beforeEach").',
      repeatedRender:
        'This file renders with the same arguments {{count}} times — render once in a beforeEach, or name the prop bag once (testing-practices → "Repeated arrangement goes in beforeEach").',
    },
  },
  create(context) {
    const { sourceCode } = context;
    const openingsByScope = new Map();
    const renders = new Map();

    const enclosingScope = (node) =>
      sourceCode.getAncestors(node).findLast(isFunction) ?? sourceCode.ast;

    const isInsideCase = (node) =>
      sourceCode.getAncestors(node).some((ancestor) => caseBody(ancestor));

    return {
      CallExpression(node) {
        const body = caseBody(node);
        if (body) {
          const [first] = body.body;
          if (first) {
            const scope = enclosingScope(node);
            if (!openingsByScope.has(scope)) {
              openingsByScope.set(scope, new Map());
            }
            addTo(
              openingsByScope.get(scope),
              normalise(sourceCode.getText(first)),
              first,
            );
          }
          return;
        }
        if (isUserEventSetup(node) && isInsideCase(node)) {
          context.report({ node, messageId: 'setupInCase' });
          return;
        }
        if (isRenderCall(node)) {
          addTo(renders, normalise(sourceCode.getText(node)), node);
        }
      },
      'Program:exit'() {
        for (const openings of openingsByScope.values()) {
          for (const statements of openings.values()) {
            if (statements.length < 2) {
              continue;
            }
            for (const statement of statements) {
              context.report({
                node: statement,
                messageId: 'repeatedOpening',
                data: { count: statements.length },
              });
            }
          }
        }
        for (const calls of renders.values()) {
          if (calls.length < REPEATED_RENDER_THRESHOLD) {
            continue;
          }
          for (const call of calls) {
            context.report({
              node: call,
              messageId: 'repeatedRender',
              data: { count: calls.length },
            });
          }
        }
      },
    };
  },
};

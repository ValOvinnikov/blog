import testingLibrary from 'eslint-plugin-testing-library';

const upstreamRule = testingLibrary.rules['no-node-access'];

const NODE_PROPERTIES = new Set([
  'activeElement',
  'children',
  'childElementCount',
  'firstChild',
  'firstElementChild',
  'fullscreenElement',
  'lastChild',
  'lastElementChild',
  'nextElementSibling',
  'nextSibling',
  'parentElement',
  'parentNode',
  'pointerLockElement',
  'previousElementSibling',
  'previousSibling',
  'rootNode',
  'scripts',
]);
const TESTING_LIBRARY_SCOPE = '@testing-library/';

const isChainedNodeWalk = (node) =>
  !node.computed &&
  node.property.type === 'Identifier' &&
  NODE_PROPERTIES.has(node.property.name) &&
  !(node.object.type === 'Identifier' && node.object.name === 'props') &&
  node.parent.type === 'MemberExpression' &&
  node.parent.object === node;

const isTestingLibraryModule = (source, utilsModule) =>
  source.startsWith(TESTING_LIBRARY_SCOPE) ||
  (typeof utilsModule === 'string' && source.endsWith(utilsModule));

const mergeListeners = (first, second) => {
  const merged = { ...first };
  for (const [selector, listener] of Object.entries(second)) {
    const existing = merged[selector];
    merged[selector] = existing
      ? (...args) => {
          existing(...args);
          listener(...args);
        }
      : listener;
  }
  return merged;
};

/**
 * `testing-library/no-node-access`, extended to report the chained walk
 * (`el.parentElement.id`, `el.children[0]`) upstream skips; it keeps the
 * upstream name so a reasoned disable of that rule still covers the line.
 */
export const noNodeAccessRule = {
  ...upstreamRule,
  meta: {
    ...upstreamRule.meta,
    messages: {
      ...upstreamRule.meta.messages,
      noChainedNodeAccess:
        'Avoid walking the DOM from a node — query the element you assert on with a screen query (testing-practices → "Never drop to a raw DOM query").',
    },
  },
  create(context) {
    const utilsModule = context.settings['testing-library/utils-module'];
    const chainedWalks = [];
    let importsTestingLibrary = false;
    return mergeListeners(upstreamRule.create(context), {
      ImportDeclaration(node) {
        if (isTestingLibraryModule(node.source.value, utilsModule)) {
          importsTestingLibrary = true;
        }
      },
      MemberExpression(node) {
        if (isChainedNodeWalk(node)) {
          chainedWalks.push(node);
        }
      },
      'Program:exit'() {
        if (!importsTestingLibrary) {
          return;
        }
        for (const node of chainedWalks) {
          context.report({
            node,
            loc: node.property.loc.start,
            messageId: 'noChainedNodeAccess',
          });
        }
      },
    });
  },
};

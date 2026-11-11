const ALLOWED_PREFIXES = [
  'TODO:',
  'FIXME:',
  'eslint-disable',
  'eslint-enable',
  '@ts-expect-error',
  '@vitest-environment',
  'prettier-ignore',
  '/ <reference',
];

const NAME_DOES_X = /^`?[A-Za-z_$][\w$.]*`?\s+[—–]\s/;
const TEST_FILE = /\.test\.[cm]?[jt]sx?$/;
const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

const textOf = (comment) =>
  comment.value
    .split('\n')
    .map((line) => line.replace(/^\s*\*?\s?/, ''))
    .join('\n')
    .trim();

const isAllowed = (comment) => {
  const text = textOf(comment);
  return ALLOWED_PREFIXES.some((prefix) => text.startsWith(prefix));
};

const spansLines = (comment) => comment.loc.start.line !== comment.loc.end.line;

const isDocBlock = (comment) =>
  comment.type === 'Block' && comment.value.startsWith('*');

const groupAdjacentLineComments = (comments) => {
  const groups = [];
  for (const comment of comments) {
    const last = groups.at(-1)?.at(-1);
    if (
      comment.type === 'Line' &&
      last?.type === 'Line' &&
      comment.loc.start.line === last.loc.end.line + 1
    ) {
      groups.at(-1).push(comment);
    } else {
      groups.push([comment]);
    }
  }
  return groups;
};

export const noFailingCommentRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Reports comments that fail CLAUDE.md's comment test in a file being changed.",
    },
    schema: [],
    messages: {
      testFile:
        'A test file carries no comments — its describe/it titles are the documentation (CLAUDE.md "Comments default to zero").',
      nameDoesX:
        'A "Name — does X" comment restates the name and signature; delete it (CLAUDE.md "Comments default to zero").',
      multiLineDocBlock:
        'A doc comment is one sentence on one line, saying what the export is for; delete or shorten it (CLAUDE.md "Comments default to zero").',
      multiLineInFunction:
        'A multi-line comment inside a function body narrates the code; restructure or rename instead (CLAUDE.md "Comments default to zero").',
    },
  },
  create(context) {
    const { sourceCode } = context;
    const isTestFile = TEST_FILE.test(context.filename);

    const isInsideFunction = (comment) => {
      let node = sourceCode.getNodeByRangeIndex(comment.range[0]);
      while (node) {
        if (FUNCTION_TYPES.has(node.type)) return true;
        node = node.parent;
      }
      return false;
    };

    return {
      'Program:exit'() {
        const comments = sourceCode
          .getAllComments()
          .filter((comment) => comment.type !== 'Shebang')
          .filter((comment) => !isAllowed(comment));
        if (isTestFile) {
          for (const comment of comments)
            context.report({ loc: comment.loc, messageId: 'testFile' });
          return;
        }
        for (const group of groupAdjacentLineComments(comments)) {
          const [first] = group;
          const loc = { start: first.loc.start, end: group.at(-1).loc.end };
          if (NAME_DOES_X.test(textOf(first))) {
            context.report({ loc, messageId: 'nameDoesX' });
          } else if (isDocBlock(first) && spansLines(first)) {
            context.report({ loc, messageId: 'multiLineDocBlock' });
          } else if (
            (group.length > 1 || spansLines(first)) &&
            isInsideFunction(first)
          ) {
            context.report({ loc, messageId: 'multiLineInFunction' });
          }
        }
      },
    };
  },
};

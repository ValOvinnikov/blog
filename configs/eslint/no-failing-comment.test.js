import { RuleTester } from 'eslint';

import { noFailingCommentRule } from './no-failing-comment.js';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
});

const TEST_FILE = 'src/a.test.ts';

ruleTester.run('no-failing-comment', noFailingCommentRule, {
  valid: [
    {
      code: '/** Resolves the tenant a request is for. */\nexport const x = 1;',
    },
    { code: '// Next requires a literal here.\nexport const revalidate = 60;' },
    {
      code: '// The first line of a module-level note\n// and its second line.\nexport const x = 1;',
    },
    {
      code: 'function f() {\n  // one tuned value\n  return 3;\n}',
    },
    {
      code: 'function f() {\n  // TODO: #12 drop once the API ships\n  // eslint-disable-next-line no-console\n  console.log(1);\n}',
    },
    {
      code: "// eslint-disable-next-line no-console -- stdout is the interface\nconsole.log('x');",
      filename: TEST_FILE,
    },
    {
      code: '// @ts-expect-error -- a deliberately wrong shape\nconst x = 1;',
      filename: TEST_FILE,
    },
    { code: '/* FIXME: #9 tidy */\nconst x = 1;', filename: TEST_FILE },
  ],
  invalid: [
    {
      code: '/**\n * Resolves the tenant.\n * Reads the host header.\n */\nexport const x = 1;',
      errors: [{ messageId: 'multiLineDocBlock' }],
    },
    {
      code: '/** HeroModule — fetches the hero and renders it. */\nexport const HeroModule = 1;',
      errors: [{ messageId: 'nameDoesX' }],
    },
    {
      code: '// toSlug — turns a title into a slug\nexport const toSlug = 1;',
      errors: [{ messageId: 'nameDoesX' }],
    },
    {
      code: 'function f() {\n  // First fetch the post,\n  // then map it.\n  return 1;\n}',
      errors: [{ messageId: 'multiLineInFunction' }],
    },
    {
      code: 'const f = () => {\n  /* fetch the post,\n     then map it */\n  return 1;\n};',
      errors: [{ messageId: 'multiLineInFunction' }],
    },
    {
      code: "// renders the title\nit('shows the title', () => {});",
      filename: TEST_FILE,
      errors: [{ messageId: 'testFile' }],
    },
  ],
});

import { RuleTester } from 'eslint';

import { noDuplicateStringRule } from './no-duplicate-string.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const options = [{ threshold: 2 }];

ruleTester.run('no-duplicate-string', noDuplicateStringRule, {
  valid: [
    {
      code: "const a = 'tenant.created.failed';",
      options,
    },
    {
      code: "const a = tv({ base: 'flex items-center gap-2', variants: { x: { y: 'flex items-center gap-2' } } });",
      options,
    },
    {
      code: "const a = cn('px-4 py-2 text-sm'); const b = cn('px-4 py-2 text-sm');",
      options,
    },
    {
      code: 'const a = <p className="flex items-center gap-2"><b className="flex items-center gap-2" /></p>;',
      options,
    },
  ],
  invalid: [
    {
      code: "const a = 'tenant.created.failed'; const b = 'tenant.created.failed';",
      options,
      errors: 1,
    },
  ],
});

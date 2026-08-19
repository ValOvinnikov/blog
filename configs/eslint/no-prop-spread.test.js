import { RuleTester } from 'eslint';

import { noPropSpreadRule } from './no-prop-spread.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-prop-spread', noPropSpreadRule, {
  valid: [
    {
      // Non-allowlisted file with no spread at all.
      code: 'export function Tag({ label }) { return <span>{label}</span>; }',
      filename: 'atoms/badge/badge.tsx',
    },
    {
      // Allowlisted polymorphic component may spread.
      code: 'export function Eyebrow({ ...rest }) { return <Component {...rest} />; }',
      filename: 'atoms/eyebrow/eyebrow.tsx',
    },
    {
      // Test files render local mock components, out of scope for this rule.
      code: 'function MockLink({ ...rest }) { return <a {...rest} />; }',
      filename: 'atoms/badge/badge.test.tsx',
    },
  ],
  invalid: [
    {
      code: 'export function Badge({ ...rest }) { return <span {...rest} />; }',
      filename: 'atoms/badge/badge.tsx',
      errors: [{ messageId: 'noSpread' }],
    },
  ],
});

import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

import { booleanPropPrefixRule } from './boolean-prop-prefix.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: tseslint.parser,
  },
});

ruleTester.run('boolean-prop-prefix', booleanPropPrefixRule, {
  valid: [
    'type TTagProps = { isDisabled?: boolean };',
    'interface ITagProps { hasIcon: boolean; }',
    // Allowlisted third-party passthrough names.
    'type TLinkProps = { prefetch?: boolean; priority?: boolean };',
    // Not a *Props type — the Result discriminant must never be touched.
    'type TResult = { ok: boolean };',
    // Non-boolean members are untouched.
    'type TTagProps = { label: string };',
    // Inline object-literal part of an intersection.
    'type TButtonProps = IWithClassName & { isDisabled?: boolean };',
    // Known limitation, not desired behaviour: an indexed access into a
    // `tv()` variants type resolves to boolean at runtime, but this is a
    // syntactic check and can't see through it. If type-aware linting is
    // ever enabled, this case should start failing and needs a deliberate
    // look rather than silently passing.
    "type TFooProps = { invalid?: TFooVariants['invalid'] };",
  ],
  invalid: [
    {
      code: 'type TTagProps = { disabled?: boolean };',
      errors: [{ messageId: 'booleanPropPrefix' }],
    },
    {
      code: 'interface ITagProps { visible: boolean; }',
      errors: [{ messageId: 'booleanPropPrefix' }],
    },
    {
      code: 'type TTagProps = { active: boolean | undefined };',
      errors: [{ messageId: 'booleanPropPrefix' }],
    },
    {
      // Intersection types are common in this repo's prop declarations
      // (e.g. `IWithClassName & { ... }`) — the inline object-literal part
      // must still be checked.
      code: 'type TButtonProps = IWithClassName & { disabled?: boolean };',
      errors: [{ messageId: 'booleanPropPrefix' }],
    },
  ],
});

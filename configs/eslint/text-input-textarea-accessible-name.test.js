import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

import { textInputTextareaAccessibleNameRule } from './text-input-textarea-accessible-name.js';

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run(
  'text-input-textarea-accessible-name',
  textInputTextareaAccessibleNameRule,
  {
    valid: [
      'const el = <TextInput value={v} onChange={onChange} ariaLabel="Name" />;',
      'const el = <Textarea value={v} onChange={onChange} ariaLabel="Bio" />;',
      // Explicit opt-out for a sibling-labelled control (e.g. VoiceField).
      'const el = <TextInput value={v} onChange={onChange} hasExternalLabel />;',
      'const el = <Textarea value={v} onChange={onChange} hasExternalLabel />;',
      // A FormField ancestor with htmlFor renders the associated <label>.
      `const el = (
        <FormField label="Name" htmlFor="name">
          <TextInput id="name" value={v} onChange={onChange} />
        </FormField>
      );`,
      `const el = (
        <FormField label="Bio" htmlFor="bio">
          <Textarea id="bio" value={v} onChange={onChange} />
        </FormField>
      );`,
      // Unrelated components are untouched.
      'const el = <Button onClick={onClick}>Save</Button>;',
    ],
    invalid: [
      {
        code: 'const el = <TextInput value={v} onChange={onChange} />;',
        errors: [{ messageId: 'missingAccessibleName' }],
      },
      {
        code: 'const el = <Textarea value={v} onChange={onChange} />;',
        errors: [{ messageId: 'missingAccessibleName' }],
      },
      {
        // A FormField ancestor with no htmlFor renders a plain span label,
        // not an associated <label htmlFor> — still unlabelled.
        code: `const el = (
          <FormField label="Name">
            <TextInput value={v} onChange={onChange} />
          </FormField>
        );`,
        errors: [{ messageId: 'missingAccessibleName' }],
      },
    ],
  },
);

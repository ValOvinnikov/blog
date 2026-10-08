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
      `const el = (
        <FormField label="Name">
          <TextInput value={v} onChange={onChange} />
        </FormField>
      );`,
      `const el = (
        <FormField label="Bio">
          <Textarea value={v} onChange={onChange} />
        </FormField>
      );`,
      `const el = (
        <Field.Root>
          <Field.Label>Name</Field.Label>
          <div>
            <TextInput value={v} onChange={onChange} />
          </div>
        </Field.Root>
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
        code: `const el = (
          <FormField label="Name" hasOwnAccessibleName={true}>
            <TextInput value={v} onChange={onChange} />
          </FormField>
        );`,
        errors: [{ messageId: 'missingAccessibleName' }],
      },
    ],
  },
);

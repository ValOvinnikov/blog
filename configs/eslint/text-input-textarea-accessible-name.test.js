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
      'const x = <TextInput ariaLabel="Name" />;',
      'const x = <Textarea ariaLabel="Bio" />;',
      'const x = <TextInput hasExternalLabel />;',
      'const x = <Textarea hasExternalLabel />;',
      'const x = <FormField label="x" htmlFor="y"><TextInput id="y" /></FormField>;',
      'const x = <FormField label="x" htmlFor="y"><Textarea id="y" /></FormField>;',
      'const x = <FormField label="x" htmlFor="y"><div><span><TextInput id="y" /></span></div></FormField>;',
      // Unrelated component name — the rule only targets TextInput/Textarea.
      'const x = <TextField />;',
    ],
    invalid: [
      {
        code: 'const x = <TextInput />;',
        errors: [{ messageId: 'missingAccessibleName' }],
      },
      {
        code: 'const x = <Textarea />;',
        errors: [{ messageId: 'missingAccessibleName' }],
      },
      {
        code: 'const x = <div><span><TextInput /></span></div>;',
        errors: [{ messageId: 'missingAccessibleName' }],
      },
      {
        code: 'const x = <Modal><TextInput /></Modal>;',
        errors: [{ messageId: 'missingAccessibleName' }],
      },
    ],
  },
);

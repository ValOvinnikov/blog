import { FlatCompat } from '@eslint/eslintrc';
import checkFile from 'eslint-plugin-check-file';

import react from './react.js';
import storybook from './storybook.js';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...react,
  ...compat.config({ extends: ['plugin:@next/next/recommended'] }),
  ...storybook,
  {
    // Next.js App Router uses bracket and paren folder conventions ([locale],
    // (group)) which are not kebab-case. Override the shared rule for src/app/.
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/!(app)/**/': 'KEBAB_CASE',
        },
      ],
    },
  },
];

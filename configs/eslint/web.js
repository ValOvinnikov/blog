import path from 'node:path';

import { FlatCompat } from '@eslint/eslintrc';
import checkFile from 'eslint-plugin-check-file';

import react from './react.js';
import storybook from './storybook.js';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});
const packageJsonPath = path.resolve(
  import.meta.dirname,
  '../../apps/web/package.json',
);

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...react,
  ...compat.config({ extends: ['plugin:@next/next/recommended'] }),
  ...storybook(packageJsonPath),
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
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'sanity',
                'sanity/*',
                'next-sanity',
                'next-sanity/*',
                '@sanity/client',
                '@sanity/client/*',
                'groqd',
                'groqd/*',
              ],
              message:
                'apps/web must not talk to Sanity directly — fetch through @blog/service.',
            },
          ],
        },
      ],
    },
  },
];

import nextPlugin from '@next/eslint-plugin-next';
import checkFile from 'eslint-plugin-check-file';

import { booleanPropPrefixRule } from './boolean-prop-prefix.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';
import react from './react.js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...react,
  nextPlugin.configs.recommended,
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
    plugins: {
      blog: { rules: { 'boolean-prop-prefix': booleanPropPrefixRule } },
    },
    rules: {
      'blog/boolean-prop-prefix': 'error',
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath],
          patterns: [
            {
              group: [
                '@blog/service',
                '@blog/service/*',
                'sanity',
                'sanity/*',
                'next-sanity',
                'next-sanity/*',
                '@sanity/*',
                'groqd',
                'groqd/*',
              ],
              message:
                'apps/admin has no content-layer concern — it must not import @blog/service or any Sanity SDK; read relational data through @blog/db.',
            },
          ],
        },
      ],
    },
  },
  {
    // Next.js reserved exports stay as declarations: every Next.js doc,
    // example and codemod emits them that way, so an arrow here reads
    // as a deviation.
    files: ['**/page.tsx', '**/layout.tsx', '**/route.ts', 'src/middleware.ts'],
    rules: {
      'func-style': 'off',
    },
  },
];

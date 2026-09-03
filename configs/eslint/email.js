import base from './base.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';

const noReactImportMessage =
  '@blog/email must not import React — it builds HTML strings and has no React at all.';
const noJsxMessage =
  '@blog/email must not use JSX — it builds email HTML as strings, never React.';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // email exports operations, not React values — the opposite of the
      // React presets' 'expression' setting; do not unify the two.
      'func-style': ['error', 'declaration'],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXElement',
          message: noJsxMessage,
        },
        {
          selector: 'JSXFragment',
          message: noJsxMessage,
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath],
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
              message: noReactImportMessage,
            },
            {
              group: [
                '@blog/ui',
                '@blog/ui/*',
                '@blog/service',
                '@blog/service/*',
                '@blog/db',
                '@blog/db/*',
                '@blog/auth',
                '@blog/auth/*',
                '@blog/studio',
                '@blog/studio/*',
                'sanity',
                'sanity/*',
                'next-sanity',
                'next-sanity/*',
                '@sanity/*',
                'groqd',
                'groqd/*',
              ],
              message:
                '@blog/email sits at the base of the dependency graph alongside @blog/config and @blog/utils — it must not import any package that depends on it.',
            },
            {
              group: ['@blog/insight', '@blog/insight/*'],
              message:
                '@blog/email must not import @blog/insight — email never logs; failures return to the caller and the app layer logs them.',
            },
          ],
        },
      ],
    },
  },
];

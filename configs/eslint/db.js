import base from './base.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXElement',
          message:
            '@blog/db must not use JSX — it is the relational data layer and never imports React.',
        },
        {
          selector: 'JSXFragment',
          message:
            '@blog/db must not use JSX — it is the relational data layer and never imports React.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath],
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
              message:
                '@blog/db must not import React — it has no React at all, client or server.',
            },
            {
              group: ['@blog/ui', '@blog/ui/*'],
              message:
                '@blog/db must not import @blog/ui — db has no presentation concerns.',
            },
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
                '@blog/db must not import @blog/service or any Sanity SDK — db and service are sibling data layers that never reference each other; a feature needing both joins them in apps/web.',
            },
          ],
        },
      ],
    },
  },
];

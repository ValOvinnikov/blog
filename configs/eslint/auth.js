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
            '@blog/auth must not use JSX — it exports Auth.js configuration only, never React components.',
        },
        {
          selector: 'JSXFragment',
          message:
            '@blog/auth must not use JSX — it exports Auth.js configuration only, never React components.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath],
          patterns: [
            {
              group: [
                'react',
                'react/*',
                'react-dom',
                'react-dom/*',
                'next-auth/react',
                'next-auth/react/*',
                '@blog/ui',
                '@blog/ui/*',
              ],
              message:
                '@blog/auth exports configuration only — React components/hooks (including next-auth/react) and @blog/ui belong to the consuming app.',
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
                '@blog/auth must not import @blog/service or any Sanity SDK — auth is a sibling of db, never a Sanity consumer.',
            },
          ],
        },
      ],
    },
  },
];

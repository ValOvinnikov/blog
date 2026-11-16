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
            '@shinefold/auth must not use JSX — it exports Auth.js configuration only, never React components.',
        },
        {
          selector: 'JSXFragment',
          message:
            '@shinefold/auth must not use JSX — it exports Auth.js configuration only, never React components.',
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
                '@shinefold/ui',
                '@shinefold/ui/*',
              ],
              message:
                '@shinefold/auth exports configuration only — React components/hooks (including next-auth/react) and @shinefold/ui belong to the consuming app.',
            },
            {
              group: [
                '@shinefold/service',
                '@shinefold/service/*',
                'sanity',
                'sanity/*',
                'next-sanity',
                'next-sanity/*',
                '@sanity/*',
                'groqd',
                'groqd/*',
              ],
              message:
                '@shinefold/auth must not import @shinefold/service or any Sanity SDK — auth is a sibling of db, never a Sanity consumer.',
            },
          ],
        },
      ],
    },
  },
];

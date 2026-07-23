import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath],
          patterns: [
            {
              group: [
                '@blog/service',
                '@blog/service/*',
                '@blog/ui',
                '@blog/ui/*',
              ],
              message:
                'This package sits at the base of the dependency graph — it must not import from packages that depend on it.',
            },
          ],
        },
      ],
    },
  },
];

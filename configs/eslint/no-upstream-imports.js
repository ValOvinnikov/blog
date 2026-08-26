import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';

// This rule is generic and unscoped by file path, so it only covers bans that
// apply everywhere it's spread in. The `@blog/db` → `@blog/auth` layering
// (db must never import auth; auth legitimately imports db, so the ban is
// one-directional, not mutual) is package-specific and enforced directly in
// db.js instead.
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

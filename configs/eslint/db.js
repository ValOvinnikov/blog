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
  // `scripts/provision-tenant/**` is ops-script territory, not the
  // query-layer surface the rule above protects (see CLAUDE.md's `db`
  // layer contract and `.claude/agents/db.md`) — the tenant-provisioning
  // workflow's content seeder is a standalone Node script that talks to a
  // brand-new tenant's Sanity project directly via `@sanity/client`, the
  // same data client `@blog/service` itself uses, never `@blog/service` or
  // the Studio-only `sanity`/`next-sanity`/`groqd` packages. Every other
  // restriction (no React, no `@blog/ui`, no `@blog/service`) still applies
  // here unchanged.
  {
    files: ['scripts/provision-tenant/**/*.{ts,tsx}'],
    rules: {
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
                'groqd',
                'groqd/*',
              ],
              message:
                '@blog/db must not import @blog/service or the Studio SDKs — a feature needing both joins them in apps/web. `@sanity/client` itself is the one exception here (see the provisioning content seeder).',
            },
          ],
        },
      ],
    },
  },
];

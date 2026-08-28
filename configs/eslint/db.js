import base from './base.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // db exports operations (getSiteConfig), not React values — the opposite
      // of the React presets' 'expression' setting; do not unify the two.
      'func-style': ['error', 'declaration'],
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
            {
              group: ['@blog/insight', '@blog/insight/*'],
              message:
                '@blog/db must not import @blog/insight — db never logs; failures return to the caller and the app layer logs them. The one exception is the standalone provision-tenant/deprovision-tenant/recheck-tenant-owners CLI scripts, which carve this out in their own override.',
            },
            {
              group: ['@blog/auth', '@blog/auth/*'],
              message:
                "@blog/db must not import @blog/auth — auth sits above db and binds the Drizzle adapter to db's own tables; the dependency only flows one way.",
            },
          ],
        },
      ],
    },
  },
  // The provisioning content seeder is a standalone Node script that talks
  // to a brand-new tenant's Sanity project directly via `@sanity/client`,
  // and logs via `@blog/insight` since it has no app layer above it — every
  // other restriction (no React, no `@blog/ui`, no `@blog/service`, no
  // Studio SDKs, no other `@sanity/*` package) still applies.
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
                '@sanity/*',
                'groqd',
                'groqd/*',
                '!@sanity/client',
                '!@sanity/client/*',
              ],
              message:
                '@blog/db must not import @blog/service or the Studio SDKs — a feature needing both joins them in apps/web. `@sanity/client` is the one exception here.',
            },
            {
              group: ['@blog/auth', '@blog/auth/*'],
              message:
                "@blog/db must not import @blog/auth — auth sits above db and binds the Drizzle adapter to db's own tables; the dependency only flows one way.",
            },
          ],
        },
      ],
    },
  },
  // deprovision-tenant is the mirror-image standalone CLI script — same
  // logging exception as provision-tenant, but no `@sanity/client` use.
  {
    files: ['scripts/deprovision-tenant/**/*.{ts,tsx}'],
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
                '@sanity/*',
                'groqd',
                'groqd/*',
              ],
              message:
                '@blog/db must not import @blog/service or any Sanity SDK — db and service are sibling data layers that never reference each other; a feature needing both joins them in apps/web.',
            },
            {
              group: ['@blog/auth', '@blog/auth/*'],
              message:
                "@blog/db must not import @blog/auth — auth sits above db and binds the Drizzle adapter to db's own tables; the dependency only flows one way.",
            },
          ],
        },
      ],
    },
  },
  // recheck-tenant-owners is the scheduled sweep counterpart — same logging
  // exception as provision-tenant/deprovision-tenant, no `@sanity/client`
  // use (it only calls `elevateTenantOwner`, imported from
  // provision-tenant/steps).
  {
    files: ['scripts/recheck-tenant-owners/**/*.{ts,tsx}'],
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
                '@sanity/*',
                'groqd',
                'groqd/*',
              ],
              message:
                '@blog/db must not import @blog/service or any Sanity SDK — db and service are sibling data layers that never reference each other; a feature needing both joins them in apps/web.',
            },
            {
              group: ['@blog/auth', '@blog/auth/*'],
              message:
                "@blog/db must not import @blog/auth — auth sits above db and binds the Drizzle adapter to db's own tables; the dependency only flows one way.",
            },
          ],
        },
      ],
    },
  },
  {
    // provision-tenant/deprovision-tenant/recheck-tenant-owners are
    // standalone CLI tools — stdout IS their interface. drizzle.config.ts is
    // loaded only by the drizzle-kit CLI (db:generate/db:migrate/db:studio)
    // — same category.
    files: ['scripts/**/*.{ts,tsx}', 'drizzle.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];

import base from './base.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';

const noJsxMessage =
  '@shinefold/db must not use JSX — it is the relational data layer and never imports React.';
const noReactImportMessage =
  '@shinefold/db must not import React — it has no React at all, client or server.';
const noUiImportMessage =
  '@shinefold/db must not import @shinefold/ui — db has no presentation concerns.';

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
              group: ['@shinefold/ui', '@shinefold/ui/*'],
              message: noUiImportMessage,
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
                '@shinefold/db must not import @shinefold/service or any Sanity SDK — db and service are sibling data layers that never reference each other; a feature needing both joins them in apps/web.',
            },
            {
              group: ['@shinefold/insight', '@shinefold/insight/*'],
              message:
                '@shinefold/db must not import @shinefold/insight — db never logs; failures return to the caller and the app layer logs them. The one exception is the standalone deprovision-tenant/recheck-tenant-owners/validate-tenant-documents/migrate-tenant-content CLI scripts, which carve this out in their own override.',
            },
            {
              group: ['@shinefold/auth', '@shinefold/auth/*'],
              message:
                "@shinefold/db must not import @shinefold/auth — auth sits above db and binds the Drizzle adapter to db's own tables; the dependency only flows one way.",
            },
          ],
        },
      ],
    },
  },
  // deprovision-tenant is a standalone CLI script, so it may log.
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
              message: noReactImportMessage,
            },
            {
              group: ['@shinefold/ui', '@shinefold/ui/*'],
              message: noUiImportMessage,
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
                '@shinefold/db must not import @shinefold/service or any Sanity SDK — db and service are sibling data layers that never reference each other; a feature needing both joins them in apps/web.',
            },
            {
              group: ['@shinefold/auth', '@shinefold/auth/*'],
              message:
                "@shinefold/db must not import @shinefold/auth — auth sits above db and binds the Drizzle adapter to db's own tables; the dependency only flows one way.",
            },
          ],
        },
      ],
    },
  },
  // recheck-tenant-owners is a standalone CLI sweep, so it may log.
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
              message: noReactImportMessage,
            },
            {
              group: ['@shinefold/ui', '@shinefold/ui/*'],
              message: noUiImportMessage,
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
                '@shinefold/db must not import @shinefold/service or any Sanity SDK — db and service are sibling data layers that never reference each other; a feature needing both joins them in apps/web.',
            },
            {
              group: ['@shinefold/auth', '@shinefold/auth/*'],
              message:
                "@shinefold/db must not import @shinefold/auth — auth sits above db and binds the Drizzle adapter to db's own tables; the dependency only flows one way.",
            },
          ],
        },
      ],
    },
  },
  // validate-tenant-documents is the document-validation sweep counterpart —
  // same logging exception as the other tenant-aware scripts, no
  // `@sanity/client` use.
  {
    files: ['scripts/validate-tenant-documents/**/*.{ts,tsx}'],
    rules: {
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
              group: ['@shinefold/ui', '@shinefold/ui/*'],
              message: noUiImportMessage,
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
                '@shinefold/db must not import @shinefold/service or any Sanity SDK — db and service are sibling data layers that never reference each other; a feature needing both joins them in apps/web.',
            },
            {
              group: ['@shinefold/auth', '@shinefold/auth/*'],
              message:
                "@shinefold/db must not import @shinefold/auth — auth sits above db and binds the Drizzle adapter to db's own tables; the dependency only flows one way.",
            },
          ],
        },
      ],
    },
  },
  // migrate-tenant-content is the content-migration fan-out counterpart —
  // same logging exception as the other tenant-aware scripts, no
  // `@sanity/client` use (it shells out to `sanity`/`migrate.mjs`, same
  // mechanism as validate-tenant-documents).
  {
    files: ['scripts/migrate-tenant-content/**/*.{ts,tsx}'],
    rules: {
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
              group: ['@shinefold/ui', '@shinefold/ui/*'],
              message: noUiImportMessage,
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
                '@shinefold/db must not import @shinefold/service or any Sanity SDK — db and service are sibling data layers that never reference each other; a feature needing both joins them in apps/web.',
            },
            {
              group: ['@shinefold/auth', '@shinefold/auth/*'],
              message:
                "@shinefold/db must not import @shinefold/auth — auth sits above db and binds the Drizzle adapter to db's own tables; the dependency only flows one way.",
            },
          ],
        },
      ],
    },
  },
  {
    // deprovision-tenant/recheck-tenant-owners/validate-tenant-documents/
    // migrate-tenant-content are standalone CLI
    // tools — stdout IS their interface. drizzle.config.ts is loaded only by
    // the drizzle-kit CLI (db:generate/db:migrate/db:studio) — same category.
    files: ['scripts/**/*.{ts,tsx}', 'drizzle.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];

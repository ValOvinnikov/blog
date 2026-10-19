import base from './base.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';

const noJsxMessage =
  'apps/worker must not use JSX — it runs provisioning workflows and never renders React.';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // worker exports operations (workflow and step functions), not React
      // values — the opposite of the React presets' 'expression' setting; do
      // not unify the two.
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
              message:
                'apps/worker must not import React — it has no UI, client or server.',
            },
            {
              group: [
                '@blog/ui',
                '@blog/ui/*',
                '@blog/service',
                '@blog/service/*',
                '@blog/auth',
                '@blog/auth/*',
                '@blog/studio',
                '@blog/studio/*',
              ],
              message:
                'apps/worker must not import @blog/ui, @blog/service, @blog/auth or @blog/studio — it consumes db, config, utils, insight, email and @sanity/client only.',
            },
            {
              group: [
                'sanity',
                'sanity/*',
                'next-sanity',
                'next-sanity/*',
                'groqd',
                'groqd/*',
              ],
              message:
                'apps/worker must not import the Studio or query SDKs — its one Sanity dependency is @sanity/client, used for provisioning.',
            },
          ],
        },
      ],
    },
  },
];

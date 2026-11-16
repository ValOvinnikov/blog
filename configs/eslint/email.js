import base from './base.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';

const noReactImportMessage =
  '@shinefold/email must not import React — it builds HTML strings and has no React at all.';
const noConfigReactMessage =
  '@shinefold/email must not import @shinefold/config/react — it holds React prop helpers, and email has no React at all.';
const noJsxMessage =
  '@shinefold/email must not use JSX — it builds email HTML as strings, never React.';

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
              regex:
                '^(?!@shinefold/config/react(/|$))(.*/)?react(-dom)?(/.*)?$',
              message: noReactImportMessage,
            },
            {
              group: ['@shinefold/config/react', '@shinefold/config/react/*'],
              message: noConfigReactMessage,
            },
            {
              group: [
                '@shinefold/ui',
                '@shinefold/ui/*',
                '@shinefold/service',
                '@shinefold/service/*',
                '@shinefold/db',
                '@shinefold/db/*',
                '@shinefold/auth',
                '@shinefold/auth/*',
                '@shinefold/studio',
                '@shinefold/studio/*',
                'sanity',
                'sanity/*',
                'next-sanity',
                'next-sanity/*',
                '@sanity/*',
                'groqd',
                'groqd/*',
              ],
              message:
                '@shinefold/email sits low in the dependency graph, above @shinefold/config and @shinefold/utils only — it must not import any package that depends on it.',
            },
            {
              group: ['@shinefold/insight', '@shinefold/insight/*'],
              message:
                '@shinefold/email must not import @shinefold/insight — email never logs; failures return to the caller and the app layer logs them.',
            },
          ],
        },
      ],
    },
  },
];

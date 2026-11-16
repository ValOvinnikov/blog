import base from './base.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // service exports operations, not React values — the opposite of the
      // React presets' 'expression' setting; do not unify the two.
      'func-style': ['error', 'declaration'],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXElement',
          message:
            '@shinefold/service must not use JSX — it is the data layer and never imports React.',
        },
        {
          selector: 'JSXFragment',
          message:
            '@shinefold/service must not use JSX — it is the data layer and never imports React.',
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
                '@shinefold/service must not import React — it is the only package that talks to Sanity and never touches React.',
            },
            {
              group: ['@shinefold/ui', '@shinefold/ui/*'],
              message:
                '@shinefold/service must not import @shinefold/ui — service has no presentation concerns.',
            },
          ],
        },
      ],
    },
  },
];

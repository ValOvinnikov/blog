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
            '@blog/service must not use JSX — it is the data layer and never imports React.',
        },
        {
          selector: 'JSXFragment',
          message:
            '@blog/service must not use JSX — it is the data layer and never imports React.',
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
                '@blog/service must not import React — it is the only package that talks to Sanity and never touches React.',
            },
            {
              group: ['@blog/ui', '@blog/ui/*'],
              message:
                '@blog/service must not import @blog/ui — service has no presentation concerns.',
            },
          ],
        },
      ],
    },
  },
];

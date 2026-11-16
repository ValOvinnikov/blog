import path from 'node:path';

import { booleanPropPrefixRule } from './boolean-prop-prefix.js';
import { noPropSpreadRule } from './no-prop-spread.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';
import react from './react.js';
import storybook from './storybook.js';

const packageJsonPath = path.resolve(
  import.meta.dirname,
  '../../packages/ui/package.json',
);

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...react,
  ...storybook(packageJsonPath),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      shinefold: {
        rules: {
          'no-prop-spread': noPropSpreadRule,
          'boolean-prop-prefix': booleanPropPrefixRule,
        },
      },
    },
    rules: {
      'shinefold/no-prop-spread': 'error',
      'shinefold/boolean-prop-prefix': 'error',
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            '@shinefold/ui is pure and prop-driven — fetch data in apps/web and pass typed props down.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath],
          patterns: [
            {
              group: ['@shinefold/service', '@shinefold/service/*'],
              message:
                '@shinefold/ui must not import @shinefold/service — it is pure and prop-driven; fetch in apps/web and pass typed props down.',
            },
            {
              group: ['sanity', 'sanity/*', 'next-sanity', 'next-sanity/*'],
              message:
                '@shinefold/ui must not import Sanity SDKs — only @shinefold/service talks to Sanity.',
            },
            {
              group: ['next', 'next/*'],
              message:
                '@shinefold/ui must not import Next.js — it is framework-agnostic; composition happens in apps/web.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "Program > ExpressionStatement:first-child > Literal[value='use client']",
          message:
            "@shinefold/ui must not use 'use client' — client directives belong only in apps/web.",
        },
      ],
    },
  },
];

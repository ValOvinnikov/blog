import path from 'node:path';

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
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            '@blog/ui is pure and prop-driven — fetch data in apps/web and pass typed props down.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@blog/service', '@blog/service/*'],
              message:
                '@blog/ui must not import @blog/service — it is pure and prop-driven; fetch in apps/web and pass typed props down.',
            },
            {
              group: ['sanity', 'sanity/*', 'next-sanity', 'next-sanity/*'],
              message:
                '@blog/ui must not import Sanity SDKs — only @blog/service talks to Sanity.',
            },
            {
              group: ['next', 'next/*'],
              message:
                '@blog/ui must not import Next.js — it is framework-agnostic; composition happens in apps/web.',
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
            "@blog/ui must not use 'use client' — client directives belong only in apps/web.",
        },
      ],
    },
  },
];

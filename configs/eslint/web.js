import path from 'node:path';

import nextPlugin from '@next/eslint-plugin-next';

import { nextAppFolderNaming } from './base.js';
import { booleanPropPrefixRule } from './boolean-prop-prefix.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';
import react from './react.js';
import storybook from './storybook.js';

const packageJsonPath = path.resolve(
  import.meta.dirname,
  '../../apps/web/package.json',
);

const sanityRestrictedGroup = {
  group: [
    'sanity',
    'sanity/*',
    'next-sanity',
    'next-sanity/*',
    '@sanity/client',
    '@sanity/client/*',
    'groqd',
    'groqd/*',
  ],
  message:
    'apps/web must not talk to Sanity directly — fetch through @blog/service.',
};

const configuredTvPath = {
  name: 'tailwind-variants',
  importNames: ['tv', 'createTV'],
  message:
    "Import tv from '@blog/ui/lib/styling' — the unconfigured tailwind-merge drops the repo's custom size and spacing tokens.",
};

const webTestingRestrictedGroup = {
  group: ['@web/testing', '@web/testing/*', '**/testing/**'],
  message:
    'src/testing/ holds test-only helpers (custom renders, fixtures) that would drag @testing-library/react and its fixtures into the production bundle — import it only from *.test.{ts,tsx}, other src/testing files, *.stories.{ts,tsx}, __mocks__ fakes, or .storybook config.',
};

const TESTING_IMPORT_ALLOWED_FILES = [
  '**/*.test.{ts,tsx}',
  'src/testing/**/*.{ts,tsx}',
  '**/*.stories.{ts,tsx}',
  '.storybook/**/*.{ts,tsx}',
  '**/__mocks__/*.{ts,tsx}',
];

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...react,
  nextPlugin.configs.recommended,
  ...storybook(packageJsonPath),
  nextAppFolderNaming,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      blog: { rules: { 'boolean-prop-prefix': booleanPropPrefixRule } },
    },
    rules: {
      'blog/boolean-prop-prefix': 'error',
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath, configuredTvPath],
          patterns: [sanityRestrictedGroup, webTestingRestrictedGroup],
        },
      ],
    },
  },
  {
    // src/testing/ helpers legitimately import each other, and *.test,
    // *.stories and .storybook config are their legitimate consumers —
    // narrow no-restricted-imports back to the Sanity-SDK ban for those.
    files: TESTING_IMPORT_ALLOWED_FILES,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath, configuredTvPath],
          patterns: [sanityRestrictedGroup],
        },
      ],
    },
  },
  {
    // Playwright specs may log to aid debugging a failed run; the Vitest setup wraps console.error to catch React act() warnings.
    files: ['e2e/**/*.{ts,tsx}', 'src/vitest-setup.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Next.js reserved exports (generateMetadata, route verbs, ...) stay as
    // function declarations — framework API surface, not app code.
    files: [
      '**/page.tsx',
      '**/layout.tsx',
      '**/route.ts',
      '**/not-found.tsx',
      '**/global-not-found.tsx',
    ],
    rules: {
      'func-style': 'off',
    },
  },
];

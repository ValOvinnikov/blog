import nextPlugin from '@next/eslint-plugin-next';

import { nextAppFolderNaming } from './base.js';
import { booleanPropPrefixRule } from './boolean-prop-prefix.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';
import react from './react.js';
import { textInputTextareaAccessibleNameRule } from './text-input-textarea-accessible-name.js';

const contentLayerRestrictedGroup = {
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
    'apps/platform has no content-layer concern — it must not import @shinefold/service or any Sanity SDK; read relational data through @shinefold/db.',
};

const uiRestrictedGroup = {
  group: ['@shinefold/ui', '@shinefold/ui/*'],
  message:
    'apps/platform has dropped @shinefold/ui everywhere except site-preview/ (its samples render real blog UI for the tenant preview) — build platform UI from in-app Base UI-based primitives instead.',
};

const platformTestingRestrictedGroup = {
  group: ['@platform/testing', '@platform/testing/*', '**/testing/**'],
  message:
    'src/testing/ holds test-only helpers (custom renders, fixtures) that would drag @testing-library/react and its fixtures into the production bundle — import it only from *.test.{ts,tsx}, other src/testing files, __mocks__ fakes, or *.stories.{ts,tsx}.',
};

const TESTING_IMPORT_ALLOWED_FILES = [
  '**/*.test.{ts,tsx}',
  'src/testing/**/*.{ts,tsx}',
  '**/__mocks__/**/*.{ts,tsx}',
  '**/*.stories.{ts,tsx}',
];

const SITE_PREVIEW_DIR = 'src/components/features/site-preview';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...react,
  nextPlugin.configs.recommended,
  nextAppFolderNaming,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      shinefold: {
        rules: {
          'boolean-prop-prefix': booleanPropPrefixRule,
          'text-input-textarea-accessible-name':
            textInputTextareaAccessibleNameRule,
        },
      },
    },
    rules: {
      'shinefold/boolean-prop-prefix': 'error',
      'shinefold/text-input-textarea-accessible-name': 'error',
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath],
          patterns: [
            contentLayerRestrictedGroup,
            uiRestrictedGroup,
            platformTestingRestrictedGroup,
          ],
        },
      ],
    },
  },
  {
    // The one deliberate exception to the ban above: site-preview/ renders real
    // @shinefold/ui so tenant previews match the public site.
    files: [`${SITE_PREVIEW_DIR}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath],
          patterns: [
            contentLayerRestrictedGroup,
            platformTestingRestrictedGroup,
          ],
        },
      ],
    },
  },
  {
    files: TESTING_IMPORT_ALLOWED_FILES,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath],
          patterns: [contentLayerRestrictedGroup, uiRestrictedGroup],
        },
      ],
    },
  },
  {
    // site-preview's own *.test.{ts,tsx}/*.stories.{ts,tsx} are both the
    // @shinefold/ui exception above and test-only — most specific, so it must
    // come last to win over both overrides for that intersection.
    files: [
      `${SITE_PREVIEW_DIR}/**/*.test.{ts,tsx}`,
      `${SITE_PREVIEW_DIR}/**/*.stories.{ts,tsx}`,
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath],
          patterns: [contentLayerRestrictedGroup],
        },
      ],
    },
  },
  {
    // Next.js reserved exports stay as declarations: every Next.js doc,
    // example and codemod emits them that way, so an arrow here reads
    // as a deviation.
    files: ['**/page.tsx', '**/layout.tsx', '**/route.ts', 'src/proxy.ts'],
    rules: {
      'func-style': 'off',
    },
  },
  {
    // The Vitest setup wraps console.error to catch React act() warnings.
    files: ['src/vitest-setup.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];

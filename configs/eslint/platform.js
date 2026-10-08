import nextPlugin from '@next/eslint-plugin-next';
import checkFile from 'eslint-plugin-check-file';

import { booleanPropPrefixRule } from './boolean-prop-prefix.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';
import react from './react.js';
import { textInputTextareaAccessibleNameRule } from './text-input-textarea-accessible-name.js';

const contentLayerRestrictedGroup = {
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
    'apps/platform has no content-layer concern — it must not import @blog/service or any Sanity SDK; read relational data through @blog/db.',
};

const uiRestrictedGroup = {
  group: ['@blog/ui', '@blog/ui/*'],
  message:
    'apps/platform has dropped @blog/ui everywhere except site-preview/ (its samples render real blog UI for the tenant preview) — build admin UI from in-app Base UI-based primitives instead.',
};

const platformTestingRestrictedGroup = {
  group: ['@platform/testing', '@platform/testing/*', '**/testing/**'],
  message:
    'src/testing/ holds test-only helpers (custom renders, fixtures) that would drag @testing-library/react and its fixtures into the production bundle — import it only from *.test.{ts,tsx}, other src/testing files, __mocks__ fakes, or *.stories.{ts,tsx}.',
};

const TESTING_IMPORT_ALLOWED_FILES = [
  '**/*.test.{ts,tsx}',
  'src/testing/**/*.{ts,tsx}',
  '**/__mocks__/*.{ts,tsx}',
  '**/*.stories.{ts,tsx}',
];

const SITE_PREVIEW_DIR = 'src/components/features/site-preview';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...react,
  nextPlugin.configs.recommended,
  {
    // Next.js App Router uses bracket and paren folder conventions ([locale],
    // (group)) which are not kebab-case. Override the shared rule for src/app/.
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/folder-naming-convention': [
        'error',
        {
          'src/!(app)/**/': 'KEBAB_CASE',
        },
        { ignoreWords: ['__mocks__'] },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      blog: {
        rules: {
          'boolean-prop-prefix': booleanPropPrefixRule,
          'text-input-textarea-accessible-name':
            textInputTextareaAccessibleNameRule,
        },
      },
    },
    rules: {
      'blog/boolean-prop-prefix': 'error',
      'blog/text-input-textarea-accessible-name': 'error',
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
    // @blog/ui so tenant previews match the public site.
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
    // @blog/ui exception above and test-only — most specific, so it must
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
];

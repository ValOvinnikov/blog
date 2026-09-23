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
    'apps/platform has dropped @blog/ui everywhere except look-preview/preview-sample (the sample renders real blog UI for the tenant preview) — build admin UI from in-app Base UI-based primitives instead.',
};

const platformTestingRestrictedGroup = {
  group: ['@platform/testing', '@platform/testing/*', '**/testing/**'],
  message:
    'src/testing/ holds test-only helpers (custom renders, fixtures) that would drag @testing-library/react and its fixtures into the production bundle — import it only from *.test.{ts,tsx}, other src/testing files, or *.stories.{ts,tsx}.',
};

const TESTING_IMPORT_ALLOWED_FILES = [
  '**/*.test.{ts,tsx}',
  'src/testing/**/*.{ts,tsx}',
  '**/*.stories.{ts,tsx}',
];

const PREVIEW_SAMPLE_DIR =
  'src/components/features/look/look-preview/preview-sample';

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
    // The preview sample renders real @blog/ui components so tenant admins can
    // preview their look-and-feel settings against actual blog UI — the one
    // deliberate exception to the ban above.
    files: [`${PREVIEW_SAMPLE_DIR}/**/*.{ts,tsx}`],
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
    // src/testing/ helpers legitimately import each other, and are the
    // legitimate consumers of themselves — narrow no-restricted-imports back
    // to the content-layer and @blog/ui bans for *.test, other src/testing
    // files, and stories.
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
    // preview-sample's own *.test.{ts,tsx}/*.stories.{ts,tsx} are both the
    // @blog/ui exception above and test-only — most specific, so it must
    // come last to win over both overrides for that intersection.
    files: [
      `${PREVIEW_SAMPLE_DIR}/**/*.test.{ts,tsx}`,
      `${PREVIEW_SAMPLE_DIR}/**/*.stories.{ts,tsx}`,
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

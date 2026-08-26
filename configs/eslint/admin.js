import nextPlugin from '@next/eslint-plugin-next';
import checkFile from 'eslint-plugin-check-file';

import { booleanPropPrefixRule } from './boolean-prop-prefix.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';
import react from './react.js';

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
    'apps/admin has no content-layer concern — it must not import @blog/service or any Sanity SDK; read relational data through @blog/db.',
};

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
      blog: { rules: { 'boolean-prop-prefix': booleanPropPrefixRule } },
    },
    rules: {
      'blog/boolean-prop-prefix': 'error',
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'no-restricted-imports': [
        'error',
        {
          paths: [noVitestGlobalsImportPath],
          patterns: [
            contentLayerRestrictedGroup,
            {
              group: ['@blog/ui', '@blog/ui/*'],
              message:
                'apps/admin has dropped @blog/ui everywhere except look-preview/preview-sample (the sample renders real blog UI for the tenant preview) — build admin UI from in-app Base UI-based primitives instead.',
            },
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

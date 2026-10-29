import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import checkFile from 'eslint-plugin-check-file';
import importX from 'eslint-plugin-import-x';
import prettier from 'eslint-config-prettier/flat';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { noClassAssertionsRule } from './no-class-assertions.js';
import { noDuplicateStringRule } from './no-duplicate-string.js';
import { noNestedQueryRule } from './no-nested-query.js';
import { noNodeAccessRule } from './no-node-access.js';
import { noVitestGlobalsImportPath } from './no-vitest-globals-import.js';
import { preferSharedConstantRule } from './prefer-shared-constant.js';

// Set only by the touched-file gates (post-edit hook, pre-commit, `pnpm
// check:touched-lint`), so files nobody edits keep their existing violations.
const lintsTouchedFiles = process.env.BLOG_LINT_TOUCHED === '1';

// Registered on every run so a preset can switch one of these rules off for a
// file without the full lint failing on an unknown plugin.
const touchedFilePlugins = {
  files: ['**/*.{ts,tsx}'],
  plugins: {
    'blog-touched': {
      rules: {
        'prefer-shared-constant': preferSharedConstantRule,
        'no-duplicate-string': noDuplicateStringRule,
      },
    },
  },
};

const touchedFileRules = {
  files: ['**/*.{ts,tsx}'],
  ignores: ['migrations/**'],
  rules: {
    'blog-touched/prefer-shared-constant': 'error',
    'blog-touched/no-duplicate-string': ['error', { threshold: 2 }],
  },
};

const ARGUING_TITLE = [
  String.raw`\b(?:[Ii][Nn][Ss][Tt][Ee][Aa][Dd] [Oo][Ff]|[Rr][Aa][Tt][Hh][Ee][Rr] [Tt][Hh][Aa][Nn])\b`,
  'State the behaviour, not the alternative it beats — drop "instead of" / "rather than" (testing-practices → "What not to test").',
];

const touchedTestFileRules = {
  files: ['**/*.test.{ts,tsx}'],
  plugins: { vitest },
  rules: {
    'blog-test/no-nested-query': 'error',
    'vitest/valid-title': [
      'error',
      {
        allowArguments: true,
        ignoreTypeOfDescribeName: true,
        mustNotMatch: { it: ARGUING_TITLE, test: ARGUING_TITLE },
      },
    ],
  },
};

export const nextAppFolderNaming = {
  // Next.js App Router uses bracket and paren folder conventions ([locale],
  // (group)) which are not kebab-case, so src/app/ is exempt from the shared rule.
  plugins: { 'check-file': checkFile },
  rules: {
    'check-file/folder-naming-convention': [
      'error',
      { 'src/!(app)/**/': 'KEBAB_CASE' },
      { ignoreWords: ['__mocks__'] },
    ],
  },
};

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      'dist/**',
      '.next/**',
      'node_modules/**',
      'storybook-static/**',
      '**/sanity/generated/types.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'import-x': importX,
    },
    rules: {
      curly: ['error', 'all'],
      'no-console': 'error',
      'no-restricted-imports': [
        'error',
        { paths: [noVitestGlobalsImportPath] },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { disallowTypeAnnotations: false },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeAlias', format: ['PascalCase'], prefix: ['T'] },
        { selector: 'interface', format: ['PascalCase'], prefix: ['I'] },
      ],
      'import-x/first': 'error',
      'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    // Workspace-specific console exemptions (the insight logger, CLI
    // scripts, e2e specs) live in their own layer preset — `files` here
    // resolves relative to each consuming workspace, so a repo-root path
    // like `packages/insight/src/**` would never match from this shared file.
    // Own namespace: registering a second rules object under `blog` throws
    // "Cannot redefine plugin".
    files: ['**/*.test.{ts,tsx}', 'src/testing/**/*.{ts,tsx}'],
    plugins: {
      'blog-test': {
        rules: {
          'no-class-assertions': noClassAssertionsRule,
          'no-nested-query': noNestedQueryRule,
        },
      },
      'testing-library': {
        ...testingLibrary,
        rules: { ...testingLibrary.rules, 'no-node-access': noNodeAccessRule },
      },
    },
    settings: {
      'testing-library/utils-module': 'testing/custom-render',
      'testing-library/custom-renders': [
        'setup',
        'customRender',
        'customRenderAsync',
        'renderElement',
        'renderWithIntl',
      ],
    },
    rules: {
      'no-console': 'off',
      'blog-test/no-class-assertions': 'error',
      'testing-library/no-container': 'error',
      'testing-library/no-node-access': 'error',
      'testing-library/prefer-screen-queries': 'error',
    },
  },
  {
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.{ts,tsx,js}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        { 'src/**/': 'KEBAB_CASE' },
        { ignoreWords: ['__mocks__'] },
      ],
    },
  },
  touchedFilePlugins,
  ...(lintsTouchedFiles ? [touchedFileRules, touchedTestFileRules] : []),
  prettier,
];

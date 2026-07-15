import js from '@eslint/js';
import checkFile from 'eslint-plugin-check-file';
import importX from 'eslint-plugin-import-x';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      'dist/**',
      '.next/**',
      'node_modules/**',
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
      'no-console': ['error', { allow: ['warn', 'error'] }],
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
      'import-x/no-duplicates': 'error',
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
          // `#/*` (service) and `@/*` (web) are this package's own subpath
          // import aliases — without this, import-x can't tell they're
          // "internal" and falls back to sorting them after every named group.
          pathGroups: [
            { pattern: '#/**', group: 'internal' },
            { pattern: '@/**', group: 'internal' },
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
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
      ],
    },
  },
  prettier,
];

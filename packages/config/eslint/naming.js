// Opt-in ESLint config fragment: T/I naming convention for hand-written TS.
// Apply in packages that do NOT use Sanity-generated types (service, ui, web).
// Excluded automatically via the base config's `**/sanity.types.ts` ignore.

/** @type {import("eslint").Linter.Config[]} */
export const namingConventionConfig = [
  {
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
          prefix: ['T'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
      ],
    },
  },
];

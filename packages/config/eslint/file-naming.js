// Opt-in ESLint config fragment: kebab-case file and folder naming.
// Apply in workspaces where filenames must be kebab-case (cms, service, types).
// Do NOT apply to packages/ui or apps/web — component files there use PascalCase
// (Button/Button.tsx, atoms/Card/Card.stories.tsx, etc.).

import checkFile from 'eslint-plugin-check-file';

/** @type {import("eslint").Linter.Config[]} */
export const fileNamingConfig = [
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
];

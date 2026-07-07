import config from '../../configs/eslint/index.js';
import checkFile from 'eslint-plugin-check-file';

export default [
  { ignores: ['next-env.d.ts'] },
  ...config,
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
];

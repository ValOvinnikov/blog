import config from '@blog/eslint-config/studio';

export default [
  { ignores: ['dist/**', '.sanity/**', 'scripts/**', 'migrations/**/*.mjs'] },
  ...config,
];

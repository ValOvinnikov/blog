import config from '@shinefold/eslint-config/studio';

export default [
  { ignores: ['dist/**', '.sanity/**', 'scripts/**', 'migrations/**/*.mjs'] },
  ...config,
];

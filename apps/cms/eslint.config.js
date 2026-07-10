import config from '@blog/eslint-config/cms';

export default [
  { ignores: ['dist/**', '.sanity/**', 'scripts/**'] },
  ...config,
];

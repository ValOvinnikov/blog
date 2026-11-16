import config from '@shinefold/eslint-config/worker';

export default [
  { ignores: ['next-env.d.ts', 'src/app/.well-known/**'] },
  ...config,
];

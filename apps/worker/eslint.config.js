import config from '@blog/eslint-config/worker';

export default [
  { ignores: ['next-env.d.ts', 'src/app/.well-known/**'] },
  ...config,
];

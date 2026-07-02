import config from '@blog/config/eslint';
import { namingConventionConfig } from '@blog/config/eslint/naming';
export default [
  { ignores: ['next-env.d.ts'] },
  ...config,
  ...namingConventionConfig,
];

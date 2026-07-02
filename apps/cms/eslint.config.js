import config from '@blog/config/eslint';
import { fileNamingConfig } from '@blog/config/eslint/file-naming';
export default [
  { ignores: ['dist/**', '.sanity/**'] },
  ...config,
  ...fileNamingConfig,
];

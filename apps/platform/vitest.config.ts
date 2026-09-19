import { fileURLToPath } from 'node:url';

import {
  blogPackageAlias,
  createVitestConfig,
} from '@blog/vitest-config/preset';

export default createVitestConfig({
  resolve: {
    alias: [
      {
        find: /^@platform\//,
        replacement: `${fileURLToPath(new URL('./src', import.meta.url))}/`,
      },
      blogPackageAlias('db', import.meta.url),
      blogPackageAlias('auth', import.meta.url),
      blogPackageAlias('insight', import.meta.url),
      blogPackageAlias('config', import.meta.url),
      blogPackageAlias('ui', import.meta.url),
      blogPackageAlias('studio', import.meta.url),
      blogPackageAlias('utils', import.meta.url),
      blogPackageAlias('email', import.meta.url),
    ],
  },
});

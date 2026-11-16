import preset, { blogPackageAlias } from '@shinefold/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  preset,
  defineConfig({
    resolve: {
      alias: [
        blogPackageAlias('config', import.meta.url),
        blogPackageAlias('utils', import.meta.url),
      ],
    },
  }),
);

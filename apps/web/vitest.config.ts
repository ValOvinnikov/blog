import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/vitest-setup.ts'],
    },
  }),
);

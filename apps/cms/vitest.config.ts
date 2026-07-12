import preset from '@blog/vitest-config/preset';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  preset,
  defineConfig({
    test: {
      environment: 'node',
      // Migrations live outside `src/` (apps/cms/migrations/**), so the
      // preset's default `src/**` include won't catch them.
      include: ['migrations/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    },
  }),
);

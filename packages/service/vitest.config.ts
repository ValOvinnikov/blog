import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Service is pure, React-free logic — a minimal node config (no React plugin).
const src = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    mockReset: true,
    include: ['src/**/*.{test,spec}.ts'],
    env: {
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
      NEXT_PUBLIC_SANITY_DATASET: 'test',
    },
  },
  resolve: {
    alias: [{ find: /^#\//, replacement: `${src}/` }],
  },
});

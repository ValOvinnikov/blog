import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const src = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: [{ find: /^@blog\/insight\//, replacement: `${src}/` }],
  },
});

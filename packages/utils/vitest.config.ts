import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const utilsSrc = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^@blog\/utils\//, replacement: `${utilsSrc}/` }],
  },
  test: {
    environment: 'node',
    globals: true,
  },
});

import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';

// RTL's own auto-cleanup registers `afterEach` at module load time, so with a
// shared module cache across files it only attaches to the first file that
// imports it; registering it here works because setup files re-run per file.
afterEach(() => {
  cleanup();
});

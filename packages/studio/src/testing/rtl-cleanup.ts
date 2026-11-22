import { cleanup } from '@testing-library/react';

// With `isolate: false` RTL registers its own afterEach only in the first test file a worker loads.
afterEach(() => {
  cleanup();
});

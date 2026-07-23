import { notFound } from 'next/navigation';

import '@testing-library/jest-dom/vitest';

// Placeholder values for the validated env module (`@/utils/env/env`) so
// components/routes that read it can render under Vitest without requiring
// a real `.env` file. Tests never hit the network, so these values only need
// to satisfy the Zod schema shape.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'test-project';
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'test-dataset';
process.env.NEXT_PUBLIC_SITE_URL ??= 'https://example.com';

// `next-intl/server`'s `setRequestLocale` is called by every locale-aware
// layout/page but never asserted on — stub it globally so individual test
// files don't repeat the mock.
vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
}));

// `next/navigation`'s `notFound()` must keep throwing so components short-
// circuit exactly as it does at runtime (Next renders the not-found boundary
// via a thrown NEXT_NOT_FOUND digest). Tests that assert on it import the
// binding directly: `import { notFound } from 'next/navigation';` then
// `expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1)`. Cleared before each
// test so call counts never leak across `it`s.
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

beforeEach(() => {
  vi.mocked(notFound).mockClear();
});

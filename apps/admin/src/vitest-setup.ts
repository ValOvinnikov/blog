import '@testing-library/jest-dom/vitest';

// `next/navigation`'s `redirect()` must keep throwing so a gate component
// short-circuits exactly as it does at runtime (Next renders the redirect via
// a thrown NEXT_REDIRECT digest) — mocked globally since every layout under a
// gated segment calls it, not just the one test file that asserts on it.
// This mock is total: it exports only `redirect`, so a future test importing
// e.g. `usePathname` or `notFound` gets `undefined` and must widen it.
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

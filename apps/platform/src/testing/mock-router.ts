import { useRouter } from 'next/navigation';
import type { Mock } from 'vitest';

type TRouter = ReturnType<typeof useRouter>;

/**
 * Re-mocks `next/navigation`'s `useRouter()`, defaulting every method to a
 * no-op — matching the global default in `vitest-setup.ts` — except for
 * whichever ones the caller supplies, so a test can assert e.g.
 * `router.push`/`router.refresh` was called with a specific value.
 */
export const mockRouter = (overrides: Partial<TRouter> = {}): TRouter => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  } as unknown as TRouter;

  vi.mocked(useRouter).mockReturnValue(router);

  return router;
};

/** Shorthand for the common case of only needing to assert `router.refresh()`. */
export const mockRouterRefresh = (
  refresh: Mock<() => void> = vi.fn(),
): Mock<() => void> => {
  mockRouter({ refresh });

  return refresh;
};

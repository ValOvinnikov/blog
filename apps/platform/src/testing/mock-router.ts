import { useRouter } from 'next/navigation';
import type { Mock } from 'vitest';

import { createRouterStub } from './router-stub';

type TRouter = ReturnType<typeof useRouter>;

export const mockRouter = (overrides: Partial<TRouter> = {}): TRouter => {
  const router = { ...createRouterStub(), ...overrides } as unknown as TRouter;

  vi.mocked(useRouter).mockReturnValue(router);

  return router;
};

export const mockRouterRefresh = (
  refresh: Mock<() => void> = vi.fn(),
): Mock<() => void> => {
  mockRouter({ refresh });

  return refresh;
};

import { useRouter } from 'next/navigation';
import type { Mock } from 'vitest';

export const stubRouterRefresh = (refresh: Mock): void => {
  vi.mocked(useRouter).mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh,
  } as unknown as ReturnType<typeof useRouter>);
};

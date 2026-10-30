import { useRouter } from '@platform/i18n/navigation';
import type { Mock } from 'vitest';

import { createRouterStub } from './router-stub';

type TLocaleRouter = ReturnType<typeof useRouter>;

export const mockLocaleRouterPush = (): Mock => {
  const router = createRouterStub();

  vi.mocked(useRouter).mockReturnValue(router as unknown as TLocaleRouter);

  return router.push;
};

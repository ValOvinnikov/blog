import { auth } from '@web/server/auth/auth';
import type { Session } from 'next-auth';

export const arrangeNoSessionOnce = (): void => {
  vi.mocked(
    auth as unknown as () => Promise<Session | null>,
  ).mockResolvedValueOnce(null);
};

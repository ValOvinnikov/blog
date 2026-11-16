import type { TMaybeNull } from '@shinefold/config';
import { auth } from '@web/server/auth/auth';
import type { Session } from 'next-auth';

export const mockedAuth = () =>
  vi.mocked(auth as unknown as () => Promise<TMaybeNull<Session>>);

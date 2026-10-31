import type { TMaybeNull } from '@blog/config';
import { auth } from '@web/server/auth/auth';
import type { Session } from 'next-auth';

export const mockedAuth = () =>
  vi.mocked(auth as unknown as () => Promise<TMaybeNull<Session>>);

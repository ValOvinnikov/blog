import { auth } from '@platform/server/auth/auth';
import type { TMaybeNull } from '@shinefold/config';
import type { Session } from 'next-auth';

export const mockedAuth = vi.mocked<() => Promise<TMaybeNull<Session>>>(auth);

export const mockedPartialAuth =
  vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

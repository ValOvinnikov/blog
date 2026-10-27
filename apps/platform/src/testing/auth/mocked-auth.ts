import type { TMaybeNull } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import type { Session } from 'next-auth';

export const mockedAuth = vi.mocked<() => Promise<TMaybeNull<Session>>>(auth);

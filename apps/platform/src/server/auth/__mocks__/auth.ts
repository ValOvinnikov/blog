import { MOCK_SESSION_EXPIRES } from '@platform/testing/auth/fixtures';
import type { Session } from 'next-auth';

export const auth = vi.fn(async (): Promise<Session | null> => ({
  user: { id: 'user-1', email: 'user@example.com' },
  expires: MOCK_SESSION_EXPIRES,
}));

export const getSession = vi.fn(() => auth());

export const signIn = vi.fn();

export const signOut = vi.fn();

export const GET = vi.fn();

export const POST = vi.fn();

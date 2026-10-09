import type { Session } from 'next-auth';

export const auth = vi.fn(async (): Promise<Session | null> => ({
  user: { id: 'user-1', email: 'user@example.com' },
  expires: '2099-01-01T00:00:00.000Z',
}));

export const signIn = vi.fn();

export const signOut = vi.fn();

export const GET = vi.fn();

export const POST = vi.fn();

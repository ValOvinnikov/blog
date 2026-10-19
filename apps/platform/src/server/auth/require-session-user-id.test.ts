import { auth } from '@platform/server/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { requireSessionUserId } from './require-session-user-id';

vi.mock('@platform/server/auth/auth');

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

describe(requireSessionUserId, () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('returns the signed-in user id', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });

    await expect(requireSessionUserId()).resolves.toBe('user-1');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('sends a signed-out visitor to sign-in, returning to the page they asked for', async () => {
    authMock.mockResolvedValue(null);
    vi.mocked(headers).mockResolvedValueOnce(
      new Headers({ 'x-admin-requested-path': '/dashboard/leads?page=2' }),
    );

    await expect(requireSessionUserId()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith(
      '/api/auth/signin?callbackUrl=%2Fdashboard%2Fleads%3Fpage%3D2',
    );
  });

  it('returns a signed-out visitor to home when the requested page is unknown', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireSessionUserId()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
  });
});

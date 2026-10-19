import { auth, GET as handleAuthGet } from '@platform/server/auth/auth';
import { NextRequest } from 'next/server';
import type { Session } from 'next-auth';

import { GET } from './route';

vi.mock('@platform/server/auth/auth');

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const handleAuthGetMock = vi.mocked(handleAuthGet);

const request = (path: string) =>
  new NextRequest(`https://admin.example.com${path}`);

describe('GET /api/auth/[...nextauth]', () => {
  beforeEach(() => {
    authMock.mockReset();
    handleAuthGetMock.mockResolvedValue(new Response('auth.js'));
  });

  it('sends a signed-in user away from the sign-in page to home', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });

    const response = await GET(request('/api/auth/signin?callbackUrl=%2F'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://admin.example.com/');
    expect(handleAuthGetMock).not.toHaveBeenCalled();
  });

  it('shows the sign-in page to a signed-out visitor', async () => {
    authMock.mockResolvedValue(null);
    const signInRequest = request('/api/auth/signin?callbackUrl=%2F');

    const response = await GET(signInRequest);

    await expect(response.text()).resolves.toBe('auth.js');
    expect(handleAuthGetMock).toHaveBeenCalledWith(signInRequest);
  });

  it('passes every other auth route through without reading the session', async () => {
    const callbackRequest = request('/api/auth/callback/github?code=abc');

    await GET(callbackRequest);

    expect(handleAuthGetMock).toHaveBeenCalledWith(callbackRequest);
    expect(authMock).not.toHaveBeenCalled();
  });
});

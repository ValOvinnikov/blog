import { faker } from '@faker-js/faker';
import { routes } from '@shinefold/config';
import { AUTH_ERROR_TYPE, AUTH_QUERY_PARAM } from '@web/constants/sign-in';
import { mockSession } from '@web/testing/shared/session/fixtures';
import { mockedAuth } from '@web/testing/shared/session/mocked-auth';
import { NextRequest } from 'next/server';

import { GET } from './route';

vi.mock('@web/server/auth/auth');

faker.seed(7746);

const MOCK_ORIGIN = `https://${faker.internet.domainName()}`;
const { OAUTH_ACCOUNT_NOT_LINKED } = AUTH_ERROR_TYPE;

const authMock = mockedAuth();

const requestSignInError = async (search: string) => {
  const response = await GET(
    new NextRequest(`${MOCK_ORIGIN}${routes.signInError()}${search}`),
  );
  return new URL(response.headers.get('location') ?? '');
};

describe('GET /api/sign-in-error', () => {
  it.each([
    {
      title: 'a signed-in reader',
      session: mockSession(),
      path: routes.account(),
    },
    { title: 'a signed-out reader', session: null, path: routes.home() },
  ])('sends $title back to $path with the error', async ({ session, path }) => {
    authMock.mockResolvedValueOnce(session);

    const location = await requestSignInError(
      `?${AUTH_QUERY_PARAM.ERROR}=${OAUTH_ACCOUNT_NOT_LINKED}`,
    );

    expect(location.origin).toBe(MOCK_ORIGIN);
    expect(location.pathname).toBe(path);
    expect(location.searchParams.get(AUTH_QUERY_PARAM.ERROR)).toBe(
      OAUTH_ACCOUNT_NOT_LINKED,
    );
  });

  it('carries no other query parameter to the site', async () => {
    authMock.mockResolvedValueOnce(null);

    const location = await requestSignInError(
      `?callbackUrl=${encodeURIComponent(MOCK_ORIGIN)}`,
    );

    expect(location.search).toBe('');
  });
});

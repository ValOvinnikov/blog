import { buildAuthConfig } from '@blog/auth';
import { getRequestSiteOAuthCredentials } from '@web/server/auth/site-oauth-credentials/site-oauth-credentials';
import { clearNewsletterSubscribedCookieSafely } from '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie';
import { MOCK_SITE_OAUTH_CREDENTIALS } from '@web/testing/server/auth/site-oauth-credentials-fixtures';
import { MOCK_TENANT_HOST } from '@web/testing/shared/tenant/fixtures';
import { NextRequest } from 'next/server';
import NextAuth, { type NextAuthConfig } from 'next-auth';

vi.mock('next-auth', () => ({ default: vi.fn(() => ({ handlers: {} })) }));

vi.mock('@blog/auth', () => ({ buildAuthConfig: vi.fn(() => ({})) }));

vi.mock(
  '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie',
);

vi.mock('@web/server/auth/site-oauth-credentials/site-oauth-credentials');

type TConfigFactory = (
  request: NextRequest | undefined,
) => Promise<NextAuthConfig>;

let configFactory: TConfigFactory;

beforeAll(async () => {
  await import('./auth');
  const [factory] = vi.mocked(NextAuth).mock.calls[0] ?? [];
  if (typeof factory !== 'function') throw new TypeError();
  configFactory = async (request) => factory(request);
});

describe('the site Auth.js config', () => {
  it.each(['signIn', 'signOut'] as const)(
    'clears the newsletter-subscribed cookie on %s',
    async (event) => {
      const config = await configFactory(undefined);

      await config.events?.[event]?.({} as never);

      expect(clearNewsletterSubscribedCookieSafely).toHaveBeenCalledOnce();
    },
  );

  it("registers providers with the requesting site's own credentials", async () => {
    const request = new NextRequest(`https://${MOCK_TENANT_HOST}/api/auth`);
    vi.mocked(getRequestSiteOAuthCredentials).mockResolvedValueOnce(
      MOCK_SITE_OAUTH_CREDENTIALS,
    );

    await configFactory(request);

    expect(getRequestSiteOAuthCredentials).toHaveBeenCalledWith(request);
    expect(buildAuthConfig).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      MOCK_SITE_OAUTH_CREDENTIALS,
    );
  });
});

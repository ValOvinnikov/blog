import { clearNewsletterSubscribedCookieSafely } from '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie';
import NextAuth, { type NextAuthConfig } from 'next-auth';

vi.mock('next-auth', () => ({ default: vi.fn(() => ({ handlers: {} })) }));

vi.mock('@blog/auth', () => ({ buildAuthConfig: vi.fn(() => ({})) }));

vi.mock(
  '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie',
);

let config: NextAuthConfig;

beforeAll(async () => {
  await import('./auth');
  const [configFactory] = vi.mocked(NextAuth).mock.calls[0] ?? [];
  if (typeof configFactory !== 'function') throw new TypeError();
  config = await configFactory(undefined);
});

describe('the site Auth.js config', () => {
  it.each(['signIn', 'signOut'] as const)(
    'clears the newsletter-subscribed cookie on %s',
    async (event) => {
      await config.events?.[event]?.({} as never);

      expect(clearNewsletterSubscribedCookieSafely).toHaveBeenCalledOnce();
    },
  );
});

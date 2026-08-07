import { markNewsletterSubscribed } from './newsletter-subscribed-cookie';

const { setMock, cookiesMock } = vi.hoisted(() => ({
  setMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

describe(markNewsletterSubscribed, () => {
  beforeEach(() => {
    setMock.mockReset();
    cookiesMock.mockReset();
    cookiesMock.mockResolvedValue({ set: setMock });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sets a long-lived, lax, non-httpOnly cookie', async () => {
    await markNewsletterSubscribed();

    expect(setMock).toHaveBeenCalledWith(
      'newsletter_subscribed',
      '1',
      expect.objectContaining({
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        // Not httpOnly — `NewsletterForm` reads this cookie client-side via
        // `document.cookie` (see `has-newsletter-subscribed-cookie.ts`), so
        // client JS must be able to see it.
        httpOnly: false,
      }),
    );
  });

  it('marks the cookie secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await markNewsletterSubscribed();

    expect(setMock).toHaveBeenCalledWith(
      'newsletter_subscribed',
      '1',
      expect.objectContaining({ secure: true }),
    );
  });

  it('does not mark the cookie secure outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test');

    await markNewsletterSubscribed();

    expect(setMock).toHaveBeenCalledWith(
      'newsletter_subscribed',
      '1',
      expect.objectContaining({ secure: false }),
    );
  });
});

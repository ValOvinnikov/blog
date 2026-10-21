import { routes } from '@blog/config';

import {
  clearNewsletterUnsubscribeToken,
  NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
  readNewsletterUnsubscribeToken,
  storeNewsletterUnsubscribeToken,
} from './newsletter-unsubscribe-token-cookie';

const TOKEN = 'kept-unsubscribe-token';

const { setMock, getMock, deleteMock, cookiesMock } = vi.hoisted(() => ({
  setMock: vi.fn(),
  getMock: vi.fn(),
  deleteMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

beforeEach(() => {
  cookiesMock.mockResolvedValue({
    set: setMock,
    get: getMock,
    delete: deleteMock,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe(storeNewsletterUnsubscribeToken, () => {
  it('keeps the token in a short-lived, strict, httpOnly cookie scoped to the unsubscribe endpoint', async () => {
    await storeNewsletterUnsubscribeToken(TOKEN);

    expect(setMock).toHaveBeenCalledWith(
      NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
      TOKEN,
      expect.objectContaining({
        maxAge: 60 * 60,
        path: routes.newsletterUnsubscribeSubmit(),
        sameSite: 'strict',
        httpOnly: true,
      }),
    );
  });

  it('marks the cookie secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await storeNewsletterUnsubscribeToken(TOKEN);

    expect(setMock).toHaveBeenCalledWith(
      NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
      TOKEN,
      expect.objectContaining({ secure: true }),
    );
  });
});

describe(readNewsletterUnsubscribeToken, () => {
  it('reads the kept token', async () => {
    getMock.mockReturnValue({ value: TOKEN });

    await expect(readNewsletterUnsubscribeToken()).resolves.toBe(TOKEN);
    expect(getMock).toHaveBeenCalledWith(
      NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
    );
  });

  it('answers undefined when no token is kept', async () => {
    getMock.mockReturnValue(undefined);

    await expect(readNewsletterUnsubscribeToken()).resolves.toBeUndefined();
  });
});

describe(clearNewsletterUnsubscribeToken, () => {
  it('deletes the cookie on the path it was set on', async () => {
    await clearNewsletterUnsubscribeToken();

    expect(deleteMock).toHaveBeenCalledWith({
      name: NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
      path: routes.newsletterUnsubscribeSubmit(),
    });
  });
});

import { routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  mockCookieStore,
  stubCookieStore,
} from '@web/testing/server/newsletter-cookies/fixtures';

import {
  clearNewsletterUnsubscribeToken,
  NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
  readNewsletterUnsubscribeToken,
  storeNewsletterUnsubscribeToken,
} from './newsletter-unsubscribe-token-cookie';

vi.mock('next/headers');

faker.seed(6010);

const ONE_HOUR_SECONDS = 60 * 60;
const MOCK_TOKEN = faker.string.alphanumeric(16);

let cookieStore: ReturnType<typeof mockCookieStore>;

beforeEach(() => {
  cookieStore = mockCookieStore();
  stubCookieStore(cookieStore);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe(storeNewsletterUnsubscribeToken, () => {
  it('keeps the token in a short-lived httpOnly cookie on the unsubscribe path', async () => {
    vi.stubEnv('NODE_ENV', 'test');

    await storeNewsletterUnsubscribeToken(MOCK_TOKEN);

    expect(cookieStore.set).toHaveBeenCalledWith(
      NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
      MOCK_TOKEN,
      {
        maxAge: ONE_HOUR_SECONDS,
        path: routes.newsletterUnsubscribeSubmit(),
        sameSite: 'strict',
        secure: false,
        httpOnly: true,
      },
    );
  });

  it('marks the cookie secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await storeNewsletterUnsubscribeToken(MOCK_TOKEN);

    expect(cookieStore.set).toHaveBeenCalledWith(
      NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
      MOCK_TOKEN,
      {
        maxAge: ONE_HOUR_SECONDS,
        path: routes.newsletterUnsubscribeSubmit(),
        sameSite: 'strict',
        secure: true,
        httpOnly: true,
      },
    );
  });
});

describe(readNewsletterUnsubscribeToken, () => {
  it('reads the kept token', async () => {
    cookieStore.get.mockReturnValueOnce({ value: MOCK_TOKEN });

    const token = await readNewsletterUnsubscribeToken();

    expect(token).toBe(MOCK_TOKEN);
    expect(cookieStore.get).toHaveBeenCalledWith(
      NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
    );
  });

  it('answers undefined when no token is kept', async () => {
    cookieStore.get.mockReturnValueOnce(undefined);

    const token = await readNewsletterUnsubscribeToken();

    expect(token).toBeUndefined();
  });
});

describe(clearNewsletterUnsubscribeToken, () => {
  it('deletes the cookie on the path it was set on', async () => {
    await clearNewsletterUnsubscribeToken();

    expect(cookieStore.delete).toHaveBeenCalledWith({
      name: NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
      path: routes.newsletterUnsubscribeSubmit(),
    });
  });
});

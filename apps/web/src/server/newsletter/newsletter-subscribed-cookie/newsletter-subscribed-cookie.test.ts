import { ONE_YEAR_IN_SECONDS } from '@web/constants/time';
import {
  mockCookieStore,
  stubCookieStore,
} from '@web/testing/server/newsletter-cookies/fixtures';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';

import {
  clearNewsletterSubscribedCookie,
  markNewsletterSubscribed,
} from './newsletter-subscribed-cookie';

vi.mock('next/headers');

let cookieStore: ReturnType<typeof mockCookieStore>;

beforeEach(() => {
  cookieStore = mockCookieStore();
  stubCookieStore(cookieStore);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe(markNewsletterSubscribed, () => {
  it('sets a long-lived, lax, non-httpOnly cookie outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test');

    await markNewsletterSubscribed();

    expect(cookieStore.set).toHaveBeenCalledWith(
      NEWSLETTER_SUBSCRIBED_COOKIE_NAME,
      '1',
      {
        maxAge: ONE_YEAR_IN_SECONDS,
        sameSite: 'lax',
        secure: false,
        httpOnly: false,
      },
    );
  });

  it('marks the cookie secure in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await markNewsletterSubscribed();

    expect(cookieStore.set).toHaveBeenCalledWith(
      NEWSLETTER_SUBSCRIBED_COOKIE_NAME,
      '1',
      {
        maxAge: ONE_YEAR_IN_SECONDS,
        sameSite: 'lax',
        secure: true,
        httpOnly: false,
      },
    );
  });
});

describe(clearNewsletterSubscribedCookie, () => {
  it('deletes the newsletter-subscribed cookie', async () => {
    await clearNewsletterSubscribedCookie();

    expect(cookieStore.delete).toHaveBeenCalledWith(
      NEWSLETTER_SUBSCRIBED_COOKIE_NAME,
    );
  });
});

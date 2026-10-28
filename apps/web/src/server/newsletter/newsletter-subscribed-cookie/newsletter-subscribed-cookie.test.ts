import { NEWSLETTER_LOG } from '@web/constants/newsletter';
import { ONE_YEAR_IN_SECONDS } from '@web/constants/time';
import {
  mockCookieStore,
  stubCookieStore,
} from '@web/testing/server/newsletter-cookies/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { logger } from '@web/utils/logger/logger';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';

import {
  clearNewsletterSubscribedCookie,
  clearNewsletterSubscribedCookieSafely,
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

describe(clearNewsletterSubscribedCookieSafely, () => {
  it('logs and resolves when the cookie cannot be cleared', async () => {
    cookieStore.delete.mockImplementationOnce(() => {
      throw MOCK_ERROR;
    });

    await clearNewsletterSubscribedCookieSafely();

    expect(logger.error).toHaveBeenCalledWith(
      NEWSLETTER_LOG.SUBSCRIBED_COOKIE_CLEAR_FAILED,
      { error: MOCK_ERROR },
    );
  });
});

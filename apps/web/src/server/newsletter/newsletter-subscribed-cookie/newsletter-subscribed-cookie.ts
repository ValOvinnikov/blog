import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';
import { cookies } from 'next/headers';

// ~1 year — long-lived so a reader who already subscribed doesn't see the
// form again on a later visit.
const NEWSLETTER_SUBSCRIBED_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const markNewsletterSubscribed = async (): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.set(NEWSLETTER_SUBSCRIBED_COOKIE_NAME, '1', {
    maxAge: NEWSLETTER_SUBSCRIBED_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });
};

/**
 * Counterpart to `markNewsletterSubscribed`. No options are passed to
 * `delete` — the setter above sets no explicit `path`/`domain` either, so
 * both default alike and this targets the exact cookie the setter created.
 */
export const clearNewsletterSubscribedCookie = async (): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.delete(NEWSLETTER_SUBSCRIBED_COOKIE_NAME);
};

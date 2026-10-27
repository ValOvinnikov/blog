import { ONE_YEAR_IN_SECONDS } from '@web/constants/time';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';
import { cookies } from 'next/headers';

export const markNewsletterSubscribed = async (): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.set(NEWSLETTER_SUBSCRIBED_COOKIE_NAME, '1', {
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });
};

// No options: the setter sets no `path`/`domain` either, so both default alike.
export const clearNewsletterSubscribedCookie = async (): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.delete(NEWSLETTER_SUBSCRIBED_COOKIE_NAME);
};

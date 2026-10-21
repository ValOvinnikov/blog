import { routes, type TMaybeUndefined } from '@blog/config';
import { cookies } from 'next/headers';

const NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME = 'newsletter_unsubscribe_token';

// Long enough for a reader to read the page and confirm, short enough not to linger.
const NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_MAX_AGE_SECONDS = 60 * 60;

const NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_PATH =
  routes.newsletterUnsubscribeSubmit();

export const storeNewsletterUnsubscribeToken = async (
  token: string,
): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.set(NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME, token, {
    maxAge: NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_MAX_AGE_SECONDS,
    path: NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_PATH,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });
};

export const readNewsletterUnsubscribeToken = async (): Promise<
  TMaybeUndefined<string>
> => {
  const cookieStore = await cookies();

  return cookieStore.get(NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME)?.value;
};

export const clearNewsletterUnsubscribeToken = async (): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.delete({
    name: NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
    path: NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_PATH,
  });
};

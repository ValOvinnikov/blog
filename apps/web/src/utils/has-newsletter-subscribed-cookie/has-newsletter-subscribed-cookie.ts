import { isUndefined } from '@shinefold/utils/primitives';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';
import { readCookie } from '@web/utils/read-cookie';

export const hasNewsletterSubscribedCookie = (cookieString: string): boolean =>
  !isUndefined(readCookie(cookieString, NEWSLETTER_SUBSCRIBED_COOKIE_NAME));

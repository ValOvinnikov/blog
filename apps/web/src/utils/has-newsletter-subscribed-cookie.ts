import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';

/**
 * hasNewsletterSubscribedCookie — parses a raw `document.cookie` string for
 * the presence of `NEWSLETTER_SUBSCRIBED_COOKIE_NAME`. Takes the cookie
 * string as a parameter (rather than reading `document.cookie` itself) so
 * it's testable without mocking the DOM — `NewsletterForm`'s mount effect is
 * the only caller, applying the same gate uniformly to both the `full` and
 * `compact` variants (#1200).
 *
 * @example
 * hasNewsletterSubscribedCookie('newsletter_subscribed=1; theme=dark') // true
 * hasNewsletterSubscribedCookie('theme=dark') // false
 */
export function hasNewsletterSubscribedCookie(cookieString: string): boolean {
  return cookieString
    .split('; ')
    .some((entry) => entry.startsWith(`${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=`));
}

import { NEWSLETTER_RESULT, routes } from '@blog/config';
import { localeForPrefix } from '@web/i18n/routing';

const SUSPENSION_EXEMPT_PAGE_PATHS = new Set<string>([
  routes.account(),
  routes.newsletterUnsubscribeConfirmation(),
  routes.newsletterResult(NEWSLETTER_RESULT.UNSUBSCRIBED),
  routes.newsletterResult(NEWSLETTER_RESULT.UNSUBSCRIBE_INVALID),
  routes.newsletterResult(NEWSLETTER_RESULT.UNSUBSCRIBE_FAILED),
]);

export const isSuspensionExemptPagePath = (
  pathname: string,
  firstSegment: string,
): boolean => {
  const localeFreePath = localeForPrefix(firstSegment)
    ? pathname.slice(firstSegment.length + 1)
    : pathname;
  return SUSPENSION_EXEMPT_PAGE_PATHS.has(localeFreePath);
};

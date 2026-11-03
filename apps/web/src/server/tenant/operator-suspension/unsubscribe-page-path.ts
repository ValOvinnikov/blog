import { NEWSLETTER_RESULT, routes } from '@blog/config';
import { localeForPrefix } from '@web/i18n/routing';

const UNSUBSCRIBE_PAGE_PATHS = new Set<string>([
  routes.newsletterUnsubscribeConfirmation(),
  routes.newsletterResult(NEWSLETTER_RESULT.UNSUBSCRIBED),
  routes.newsletterResult(NEWSLETTER_RESULT.UNSUBSCRIBE_INVALID),
  routes.newsletterResult(NEWSLETTER_RESULT.UNSUBSCRIBE_FAILED),
]);

export const isUnsubscribePagePath = (
  pathname: string,
  firstSegment: string,
): boolean => {
  const localeFreePath = localeForPrefix(firstSegment)
    ? pathname.slice(firstSegment.length + 1)
    : pathname;
  return UNSUBSCRIBE_PAGE_PATHS.has(localeFreePath);
};

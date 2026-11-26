import type { TMaybeNull } from '@shinefold/config';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

const isInsideClosedDetails = (element: Element): boolean => {
  const closedDetails = element.parentElement?.closest('details:not([open])');
  if (!closedDetails) return false;

  const isOwnSummary =
    // eslint-disable-next-line shinefold-touched/prefer-shared-constant -- the <summary> element, not TWITTER_CARD.SUMMARY
    element.matches('summary') && element.parentElement === closedDetails;
  return isOwnSummary ? isInsideClosedDetails(closedDetails) : true;
};

export const getFocusables = (panel: TMaybeNull<HTMLElement>) =>
  Array.from(
    panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
  ).filter((element) => !isInsideClosedDetails(element));

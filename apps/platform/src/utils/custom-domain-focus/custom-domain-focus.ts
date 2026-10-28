import { CUSTOM_DOMAIN_CARD } from '@platform/constants/custom-domain';

let isFocusRequested = false;

export const requestCustomDomainCardFocus = () => {
  isFocusRequested = true;
};

export const focusRequestedCustomDomainCard = () => {
  if (!isFocusRequested) return;
  isFocusRequested = false;
  const heading = document
    .getElementById(CUSTOM_DOMAIN_CARD.ID)
    ?.querySelector('h2');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus();
};

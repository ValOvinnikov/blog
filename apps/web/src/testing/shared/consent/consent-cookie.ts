import { CONSENT_CATEGORY, type TConsentCategory } from '@blog/config';
import {
  CONSENT_COOKIE_NAME,
  decodeConsent,
  encodeConsent,
} from '@web/utils/consent-cookie';
import { readCookie } from '@web/utils/read-cookie';

export const clearConsentCookie = () => {
  document.cookie = `${CONSENT_COOKIE_NAME}=; Max-Age=0; Path=/`;
};

export const grantConsent = (
  categories: readonly TConsentCategory[] = [CONSENT_CATEGORY.EXTERNAL_MEDIA],
) => {
  document.cookie = encodeConsent(categories);
};

export const readGrantedConsent = () =>
  decodeConsent(readCookie(document.cookie, CONSENT_COOKIE_NAME));

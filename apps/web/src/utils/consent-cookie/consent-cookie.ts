import { CONSENT_CATEGORY, type TConsentCategory } from '@blog/config';

const CONSENT_COOKIE_NAME = 'consent';
const CONSENT_COOKIE_VERSION = '1';
const CONSENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export const OPTIONAL_CONSENT_CATEGORIES: readonly TConsentCategory[] =
  Object.values(CONSENT_CATEGORY).filter(
    (category) => category !== CONSENT_CATEGORY.NECESSARY,
  );

const isOptionalCategory = (value: string): value is TConsentCategory =>
  OPTIONAL_CONSENT_CATEGORIES.some((category) => category === value);

export const readConsentCookieValue = (cookieString: string): string => {
  const prefix = `${CONSENT_COOKIE_NAME}=`;
  const entry = cookieString
    .split('; ')
    .find((candidate) => candidate.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : '';
};

export const parseConsentCookieValue = (
  value: string,
): TConsentCategory[] | null => {
  const separatorIndex = value.indexOf('.');
  if (separatorIndex === -1) return null;
  if (value.slice(0, separatorIndex) !== CONSENT_COOKIE_VERSION) return null;

  const categories = value
    .slice(separatorIndex + 1)
    .split(',')
    .filter((category) => category !== '');
  return categories.every(isOptionalCategory) ? categories : null;
};

export const serializeConsentCookie = (
  granted: readonly TConsentCategory[],
): string =>
  [
    `${CONSENT_COOKIE_NAME}=${CONSENT_COOKIE_VERSION}.${granted.filter(isOptionalCategory).join(',')}`,
    `Max-Age=${CONSENT_COOKIE_MAX_AGE_SECONDS}`,
    'Path=/',
    'SameSite=Lax',
    'Secure',
  ].join('; ');

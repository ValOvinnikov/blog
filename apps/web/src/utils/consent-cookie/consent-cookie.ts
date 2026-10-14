import {
  CONSENT_CATEGORY,
  type TConsentCategory,
  type TMaybeUndefined,
} from '@blog/config';

export const CONSENT_COOKIE_NAME = 'consent';
const CONSENT_COOKIE_VERSION = '1';
const CONSENT_COOKIE_ATTRIBUTES = [
  `Max-Age=${60 * 60 * 24 * 180}`,
  'Path=/',
  'SameSite=Lax',
  'Secure',
];

export const OPTIONAL_CONSENT_CATEGORIES: readonly TConsentCategory[] =
  Object.values(CONSENT_CATEGORY).filter(
    (category) => category !== CONSENT_CATEGORY.NECESSARY,
  );

const isOptionalCategory = (value: string): value is TConsentCategory =>
  OPTIONAL_CONSENT_CATEGORIES.some((category) => category === value);

export const decodeConsent = (
  value: TMaybeUndefined<string>,
): TMaybeUndefined<TConsentCategory[]> => {
  const [version, list, ...rest] = (value ?? '').split('.');
  if (version !== CONSENT_COOKIE_VERSION || list === undefined || rest.length)
    return undefined;

  const categories = list.split(',').filter((category) => category !== '');
  return categories.every(isOptionalCategory) ? categories : undefined;
};

export const encodeConsent = (granted: readonly TConsentCategory[]): string =>
  [
    `${CONSENT_COOKIE_NAME}=${CONSENT_COOKIE_VERSION}.${granted.filter(isOptionalCategory).join(',')}`,
    ...CONSENT_COOKIE_ATTRIBUTES,
  ].join('; ');

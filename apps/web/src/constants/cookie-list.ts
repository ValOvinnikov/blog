import { buildAppCookies } from '@blog/auth/sessions/app-cookies';
import { CONSENT_CATEGORY, type TConsentCategory } from '@blog/config';
import { AUTH_APP } from '@blog/config/constants';
import type { TValueOf } from '@blog/config/utils';
import { DEPTH_STORAGE_KEY } from '@web/config/depth-script';
import { THEME_STORAGE_KEY } from '@web/config/theme-script';
import { NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME } from '@web/server/newsletter/newsletter-unsubscribe-token-cookie/newsletter-unsubscribe-token-cookie';
import { CONSENT_COOKIE_NAME } from '@web/utils/consent-cookie';
import { LANGUAGE_COOKIE_NAME } from '@web/utils/language-cookie';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';
import { SIGNED_IN_HINT_COOKIE_NAME } from '@web/utils/signed-in-hint-cookie';

export const COOKIE_PROVIDER = {
  FIRST_PARTY: 'FIRST_PARTY',
} as const;

export type TCookieProvider = TValueOf<typeof COOKIE_PROVIDER>;

export const COOKIE_ID = {
  CONSENT: 'CONSENT',
  LANGUAGE: 'LANGUAGE',
  SESSION: 'SESSION',
  CSRF: 'CSRF',
  SIGN_IN_RETURN: 'SIGN_IN_RETURN',
  OAUTH_VERIFIER: 'OAUTH_VERIFIER',
  OAUTH_STATE: 'OAUTH_STATE',
  SIGNED_IN_HINT: 'SIGNED_IN_HINT',
  NEWSLETTER_SUBSCRIBED: 'NEWSLETTER_SUBSCRIBED',
  NEWSLETTER_UNSUBSCRIBE_TOKEN: 'NEWSLETTER_UNSUBSCRIBE_TOKEN',
  READING_DEPTH: 'READING_DEPTH',
  THEME: 'THEME',
} as const;

export type TCookieId = TValueOf<typeof COOKIE_ID>;

export interface ICookieListEntry {
  id: TCookieId;
  name: string;
  provider: TCookieProvider;
  category: TConsentCategory;
}

const SIGN_IN_COOKIES = buildAppCookies(AUTH_APP.SITE, true);

const necessaryFirstPartyEntry = (
  id: TCookieId,
  name: string,
): ICookieListEntry => ({
  id,
  name,
  provider: COOKIE_PROVIDER.FIRST_PARTY,
  category: CONSENT_CATEGORY.NECESSARY,
});

/** Every cookie and browser-storage key the public site sets, under its production name; each id needs a purpose and duration under `cookieList.cookies` in the site catalog. */
export const COOKIE_LIST: readonly ICookieListEntry[] = [
  necessaryFirstPartyEntry(COOKIE_ID.CONSENT, CONSENT_COOKIE_NAME),
  necessaryFirstPartyEntry(COOKIE_ID.LANGUAGE, LANGUAGE_COOKIE_NAME),
  necessaryFirstPartyEntry(
    COOKIE_ID.SESSION,
    SIGN_IN_COOKIES.sessionToken.name,
  ),
  necessaryFirstPartyEntry(COOKIE_ID.CSRF, SIGN_IN_COOKIES.csrfToken.name),
  necessaryFirstPartyEntry(
    COOKIE_ID.SIGN_IN_RETURN,
    SIGN_IN_COOKIES.callbackUrl.name,
  ),
  necessaryFirstPartyEntry(
    COOKIE_ID.OAUTH_VERIFIER,
    SIGN_IN_COOKIES.pkceCodeVerifier.name,
  ),
  necessaryFirstPartyEntry(COOKIE_ID.OAUTH_STATE, SIGN_IN_COOKIES.state.name),
  necessaryFirstPartyEntry(
    COOKIE_ID.SIGNED_IN_HINT,
    SIGNED_IN_HINT_COOKIE_NAME,
  ),
  necessaryFirstPartyEntry(
    COOKIE_ID.NEWSLETTER_SUBSCRIBED,
    NEWSLETTER_SUBSCRIBED_COOKIE_NAME,
  ),
  necessaryFirstPartyEntry(
    COOKIE_ID.NEWSLETTER_UNSUBSCRIBE_TOKEN,
    NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME,
  ),
  necessaryFirstPartyEntry(COOKIE_ID.READING_DEPTH, DEPTH_STORAGE_KEY),
  necessaryFirstPartyEntry(COOKIE_ID.THEME, THEME_STORAGE_KEY),
];

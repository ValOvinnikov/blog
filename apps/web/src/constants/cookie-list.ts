import { CONSENT_CATEGORY, type TConsentCategory } from '@blog/config';
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

export interface ICookieListEntry {
  name: string;
  provider: TCookieProvider;
  category: TConsentCategory;
}

const necessaryFirstPartyEntry = (name: string): ICookieListEntry => ({
  name,
  provider: COOKIE_PROVIDER.FIRST_PARTY,
  category: CONSENT_CATEGORY.NECESSARY,
});

/** Every cookie and browser-storage key the public site sets; each name needs a purpose and duration under `cookieList.cookies` in the site catalog. */
export const COOKIE_LIST: readonly ICookieListEntry[] = [
  necessaryFirstPartyEntry(CONSENT_COOKIE_NAME),
  necessaryFirstPartyEntry(LANGUAGE_COOKIE_NAME),
  necessaryFirstPartyEntry(SIGNED_IN_HINT_COOKIE_NAME),
  necessaryFirstPartyEntry(NEWSLETTER_SUBSCRIBED_COOKIE_NAME),
  necessaryFirstPartyEntry(NEWSLETTER_UNSUBSCRIBE_TOKEN_COOKIE_NAME),
  necessaryFirstPartyEntry(DEPTH_STORAGE_KEY),
  necessaryFirstPartyEntry(THEME_STORAGE_KEY),
];

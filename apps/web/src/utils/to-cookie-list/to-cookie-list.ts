import { CONSENT_CATEGORY, type TMaybeUndefined } from '@shinefold/config';
import { ANALYTICS_PROVIDER } from '@shinefold/config/constants';
import type { TTenantAnalytics } from '@shinefold/db/queries/tenant-analytics/save-tenant-analytics';
import {
  COOKIE_ID,
  COOKIE_LIST,
  COOKIE_PROVIDER,
  type ICookieListEntry,
} from '@web/constants/cookie-list';

const GOOGLE_ANALYTICS_COOKIE_NAME = '_ga';
const GOOGLE_ANALYTICS_ID_PREFIX = 'G-';

const toGoogleAnalyticsEntries = (
  measurementId: string,
): ICookieListEntry[] => [
  {
    id: COOKIE_ID.GOOGLE_ANALYTICS,
    name: GOOGLE_ANALYTICS_COOKIE_NAME,
    provider: COOKIE_PROVIDER.GOOGLE,
    category: CONSENT_CATEGORY.ANALYTICS,
  },
  {
    id: COOKIE_ID.GOOGLE_ANALYTICS_VISIT,
    name: `${GOOGLE_ANALYTICS_COOKIE_NAME}_${measurementId.slice(GOOGLE_ANALYTICS_ID_PREFIX.length)}`,
    provider: COOKIE_PROVIDER.GOOGLE,
    category: CONSENT_CATEGORY.ANALYTICS,
  },
];

export const toCookieList = (
  analytics: TMaybeUndefined<TTenantAnalytics>,
): readonly ICookieListEntry[] =>
  analytics?.provider === ANALYTICS_PROVIDER.GOOGLE_ANALYTICS
    ? [...COOKIE_LIST, ...toGoogleAnalyticsEntries(analytics.analyticsId)]
    : COOKIE_LIST;

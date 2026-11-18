'use client';

import { CONSENT_CATEGORY, type TConsentCategory } from '@shinefold/config';
import { ANALYTICS_PROVIDER } from '@shinefold/config/constants';
import { useSiteAnalytics } from '@web/context/site-analytics-provider';
import { OPTIONAL_CONSENT_CATEGORIES } from '@web/utils/consent-cookie';

/** The optional categories this site asks about: Analytics only where it loads Google Analytics, the one tool that sets cookies. */
export const useOfferedConsentCategories = (): readonly TConsentCategory[] => {
  const hasGoogleAnalytics =
    useSiteAnalytics()?.provider === ANALYTICS_PROVIDER.GOOGLE_ANALYTICS;

  return hasGoogleAnalytics
    ? OPTIONAL_CONSENT_CATEGORIES
    : OPTIONAL_CONSENT_CATEGORIES.filter(
        (category) => category !== CONSENT_CATEGORY.ANALYTICS,
      );
};

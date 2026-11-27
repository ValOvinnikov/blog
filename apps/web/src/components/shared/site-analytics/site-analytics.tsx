import { ANALYTICS_PROVIDER } from '@shinefold/config/constants';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PLAUSIBLE_ORIGIN } from '@web/config/analytics-origins';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSiteAnalytics } from '@web/server/site-config/get-site-analytics/get-site-analytics';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { isWebAnalyticsEnabled } from '@web/utils/is-web-analytics-enabled';
import Script from 'next/script';

import { GoogleAnalytics } from './components/google-analytics/google-analytics';

export const SiteAnalytics = async () => {
  const { tenantId, isDraftPreview } = await getRequestContext();
  // A draft render's URL carries its signed preview token, which every analytics tool here reports.
  if (isDraftPreview) return null;

  const analytics = await getSiteAnalytics(
    tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER,
  );

  return (
    <>
      {isWebAnalyticsEnabled() && (
        <>
          <SpeedInsights />
          <Analytics />
        </>
      )}
      {analytics?.provider === ANALYTICS_PROVIDER.PLAUSIBLE && (
        <Script
          src={`${PLAUSIBLE_ORIGIN}/js/script.js`}
          data-domain={analytics.analyticsId}
        />
      )}
      {analytics?.provider === ANALYTICS_PROVIDER.GOOGLE_ANALYTICS && (
        <GoogleAnalytics measurementId={analytics.analyticsId} />
      )}
    </>
  );
};

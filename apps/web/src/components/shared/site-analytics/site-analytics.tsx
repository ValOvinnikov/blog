import { CAPABILITY } from '@blog/config';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { isWebAnalyticsEnabled } from '@web/utils/is-web-analytics-enabled';

export const SiteAnalytics = async () => {
  const isEnabled =
    isWebAnalyticsEnabled() &&
    (await isCapabilityEnabled(CAPABILITY.ANALYTICS));

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      <SpeedInsights />
      <Analytics />
    </>
  );
};

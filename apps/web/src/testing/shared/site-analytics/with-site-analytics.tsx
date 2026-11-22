import type { TTenantAnalytics } from '@shinefold/db/queries/tenant-analytics/save-tenant-analytics';
import { SiteAnalyticsProvider } from '@web/context/site-analytics-provider';
import type { ReactElement } from 'react';

export const withSiteAnalytics = (
  element: ReactElement,
  analytics: TTenantAnalytics,
) => <SiteAnalyticsProvider value={analytics}>{element}</SiteAnalyticsProvider>;

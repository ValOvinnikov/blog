'use client';

import type { TMaybeUndefined } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import type { TTenantAnalytics } from '@shinefold/db/queries/tenant-analytics/save-tenant-analytics';
import { createContext, useContext } from 'react';

const SiteAnalyticsContext =
  createContext<TMaybeUndefined<TTenantAnalytics>>(undefined);

export interface ISiteAnalyticsProviderProps extends IWithChildren {
  value: TMaybeUndefined<TTenantAnalytics>;
}

export const SiteAnalyticsProvider = ({
  value,
  children,
}: ISiteAnalyticsProviderProps) => (
  <SiteAnalyticsContext.Provider value={value}>
    {children}
  </SiteAnalyticsContext.Provider>
);

export const useSiteAnalytics = (): TMaybeUndefined<TTenantAnalytics> =>
  useContext(SiteAnalyticsContext);

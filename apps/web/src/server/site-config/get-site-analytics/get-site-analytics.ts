import {
  TENANT_CONFIG_REVALIDATE_SECONDS,
  type TMaybeNull,
  type TMaybeUndefined,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTenantAnalytics } from '@shinefold/db/queries/tenant-analytics/save-tenant-analytics';
import { safeAsync } from '@shinefold/utils';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getRequestTenantId } from '@web/server/tenant/request-tenant/request-tenant';
import { logger } from '@web/utils/logger/logger';
import {
  buildSiteConfigCacheTag,
  buildTenantPlanCacheTag,
} from '@web/utils/tenant-cache-tags';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

const getCachedTenantAnalytics = (tenantId: string) =>
  unstable_cache(
    async (id: string): Promise<TMaybeNull<TTenantAnalytics>> =>
      (await queries.tenantAnalytics.getTenantAnalytics(id)) ?? null,
    ['tenant-analytics', tenantId],
    {
      tags: [
        buildSiteConfigCacheTag(tenantId),
        buildTenantPlanCacheTag(tenantId),
      ],
      revalidate: TENANT_CONFIG_REVALIDATE_SECONDS,
    },
  )(tenantId);

const readTenantAnalytics = safeAsync(
  async (tenantId?: string): Promise<TMaybeNull<TTenantAnalytics>> =>
    tenantId ? getCachedTenantAnalytics(tenantId) : null,
);

/** The owner's analytics tool the site loads: none whenever it cannot be read. */
export const getSiteAnalytics = cache(
  async (tenant: string): Promise<TMaybeUndefined<TTenantAnalytics>> => {
    const result = await readTenantAnalytics(await getRequestTenantId(tenant));

    if (!result.ok) {
      logger.error(SITE_CONFIG_LOG.ANALYTICS_FETCH_FAILED, {
        error: result.error,
      });
      return undefined;
    }
    return result.data ?? undefined;
  },
);

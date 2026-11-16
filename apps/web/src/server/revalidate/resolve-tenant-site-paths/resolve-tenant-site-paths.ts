import type { TMaybeUndefined } from '@shinefold/config';
import { queries, TENANT_STATUS } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import {
  FETCH_FAILED_REASON,
  REVALIDATE_LOG,
  TENANT_UNRESOLVED_REASON,
} from '@web/constants/revalidate';
import { deriveTenantSitePaths } from '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths';
import { logger } from '@web/utils/logger/logger';

const loadTenant = async (
  tenantId: string,
): Promise<TResult<TMaybeUndefined<TTenant>, string>> => {
  try {
    return okResult(
      await queries.tenants.getTenantById(tenantId, { includeArchived: true }),
    );
  } catch (error) {
    logger.error(REVALIDATE_LOG.TENANT_BY_ID_LOOKUP_FAILED, {
      tenantId,
      error,
    });
    return errorResult(FETCH_FAILED_REASON);
  }
};

const isTenantArchived = ({ status, deprovisionedAt }: TTenant): boolean =>
  status === TENANT_STATUS.ARCHIVED || Boolean(deprovisionedAt);

/** An archived tenant has no pages to purge: the proxy already answers every one of them 404. */
export const resolveTenantSitePaths = async (
  tenantId: TMaybeUndefined<string>,
): Promise<TResult<string[], string>> => {
  if (!tenantId) {
    return errorResult(TENANT_UNRESOLVED_REASON);
  }
  const loaded = await loadTenant(tenantId);
  if (!loaded.ok) {
    return loaded;
  }
  const { data: tenant } = loaded;
  if (tenant && isTenantArchived(tenant)) {
    return okResult([]);
  }
  const credentials =
    tenant && queries.tenants.toTenantSanityCredentials(tenant);
  if (!credentials) {
    logger.error(REVALIDATE_LOG.TENANT_SANITY_CREDENTIALS_MISSING, {
      tenantId,
    });
    return errorResult(FETCH_FAILED_REASON);
  }
  return deriveTenantSitePaths({ tenantId, tenant: credentials });
};

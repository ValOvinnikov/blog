import type { TMaybeUndefined } from '@shinefold/config';
import { queries, TENANT_STATUS } from '@shinefold/db';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import {
  FETCH_FAILED_REASON,
  REVALIDATE_LOG,
  TENANT_UNRESOLVED_REASON,
} from '@web/constants/revalidate';
import { deriveTenantSitePaths } from '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths';
import { loadTenantSanityCredentials } from '@web/server/revalidate/load-tenant-sanity-credentials/load-tenant-sanity-credentials';
import { logger } from '@web/utils/logger/logger';

const loadIsTenantArchived = async (
  tenantId: string,
): Promise<TResult<boolean, string>> => {
  try {
    const tenant = await queries.tenants.getTenantById(tenantId, {
      includeArchived: true,
    });
    return okResult(
      tenant?.status === TENANT_STATUS.ARCHIVED ||
        Boolean(tenant?.deprovisionedAt),
    );
  } catch (error) {
    logger.error(REVALIDATE_LOG.TENANT_BY_ID_LOOKUP_FAILED, {
      tenantId,
      error,
    });
    return errorResult(FETCH_FAILED_REASON);
  }
};

/** An archived tenant has no pages to purge: the proxy already answers every one of them 404. */
export const resolveTenantSitePaths = async (
  tenantId: TMaybeUndefined<string>,
): Promise<TResult<string[], string>> => {
  if (!tenantId) {
    return errorResult(TENANT_UNRESOLVED_REASON);
  }
  const isArchived = await loadIsTenantArchived(tenantId);
  if (!isArchived.ok) {
    return isArchived;
  }
  if (isArchived.data) {
    return okResult([]);
  }
  const tenant = await loadTenantSanityCredentials({ tenantId });
  if (!tenant) {
    return errorResult(FETCH_FAILED_REASON);
  }
  return deriveTenantSitePaths({ tenantId, tenant });
};

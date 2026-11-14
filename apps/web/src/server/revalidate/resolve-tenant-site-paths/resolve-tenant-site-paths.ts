import type { TMaybeUndefined } from '@blog/config';
import { errorResult, type TResult } from '@blog/utils';
import {
  FETCH_FAILED_REASON,
  TENANT_UNRESOLVED_REASON,
} from '@web/constants/revalidate';
import { deriveTenantSitePaths } from '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths';
import { loadTenantSanityCredentials } from '@web/server/revalidate/load-tenant-sanity-credentials/load-tenant-sanity-credentials';

export const resolveTenantSitePaths = async (
  tenantId: TMaybeUndefined<string>,
): Promise<TResult<string[], string>> => {
  if (!tenantId) {
    return errorResult(TENANT_UNRESOLVED_REASON);
  }
  const tenant = await loadTenantSanityCredentials({ tenantId });
  if (!tenant) {
    return errorResult(FETCH_FAILED_REASON);
  }
  return deriveTenantSitePaths({ tenantId, tenant });
};

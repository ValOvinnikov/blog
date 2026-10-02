import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { isProductionEnvironment } from '@web/utils/is-production-environment';

/**
 * Production additionally requires `provisioningStatus` READY: a failed run can leave credentials but no content. Local/dev rows predate `provisioningStatus` tracking.
 */
export const isTenantServable = (tenant: TTenant): boolean => {
  const hasCredentials =
    tenant.status !== TENANT_STATUS.ARCHIVED &&
    Boolean(tenant.sanityProjectId) &&
    Boolean(tenant.sanityDataset) &&
    Boolean(tenant.sanityReadTokenEncrypted);

  if (!hasCredentials) return false;

  if (!isProductionEnvironment()) return true;

  return tenant.provisioningStatus === TENANT_PROVISIONING_STATUS.READY;
};

import { TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';

/**
 * isTenantServable — the read-side gate `resolveTenant()` applies to a
 * matched tenant row: an archived tenant, or one still mid-provisioning
 * with no Sanity project/dataset/read token persisted yet, must never be
 * resolved as though it were ready to serve content.
 */
export const isTenantServable = (tenant: TTenant): boolean => {
  return (
    tenant.status !== TENANT_STATUS.ARCHIVED &&
    Boolean(tenant.sanityProjectId) &&
    Boolean(tenant.sanityDataset) &&
    Boolean(tenant.sanityReadTokenEncrypted)
  );
};

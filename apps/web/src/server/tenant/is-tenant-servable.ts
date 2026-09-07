import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { isProductionEnvironment } from '@web/utils/is-production-environment';

/**
 * isTenantServable — the read-side gate `resolveTenant()` applies to a
 * matched tenant row: an archived tenant, or one still mid-provisioning
 * with no Sanity project/dataset/read token persisted yet, must never be
 * resolved as though it were ready to serve content. In production, a
 * tenant whose provisioning hasn't reached `READY` is refused too, even if
 * credentials are present — a failed or interrupted run can leave a tenant
 * with credentials but no content (e.g. no `settings_site`), which must
 * fail closed rather than serve a broken site. Scoped to production because
 * local/dev tenant rows predate `provisioningStatus` tracking and
 * legitimately have none.
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

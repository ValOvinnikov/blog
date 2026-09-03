import { queries, TENANT_STATUS } from '@blog/db';

/**
 * isTenantActive — the write-side gate user-initiated tenant-scoped
 * mutations check before touching a row: a SUSPENDED or ARCHIVED tenant's
 * site stays readable, but the write is refused so nothing lands against a
 * frozen or torn-down tenant. Webhook-driven cascade cleanup is deliberately
 * exempt, since it must run regardless of tenant status.
 */
export const isTenantActive = async (tenantId: string): Promise<boolean> => {
  const tenant = await queries.tenants.getTenantById(tenantId);
  return tenant?.status === TENANT_STATUS.ACTIVE;
};

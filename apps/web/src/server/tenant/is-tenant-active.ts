import { queries, TENANT_STATUS } from '@blog/db';

/**
 * isTenantActive — the write-side gate a tenant-scoped user mutation must
 * pass before touching a row: a SUSPENDED or ARCHIVED tenant's site stays
 * readable, but its writes are refused so nothing lands against a frozen
 * or torn-down tenant. Webhook-driven cascade cleanup is deliberately
 * exempt — it must run regardless of tenant status to avoid orphaning rows.
 */
export const isTenantActive = async (tenantId: string): Promise<boolean> => {
  const tenant = await queries.tenants.getTenantById(tenantId);
  return tenant?.status === TENANT_STATUS.ACTIVE;
};

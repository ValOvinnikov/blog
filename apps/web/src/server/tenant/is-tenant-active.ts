import { queries, TENANT_STATUS } from '@blog/db';

/**
 * isTenantActive — the write-side gate every tenant-scoped mutation must
 * pass before touching a row: a SUSPENDED or ARCHIVED tenant's site stays
 * readable, but its writes are refused so nothing lands against a frozen
 * or torn-down tenant.
 */
export const isTenantActive = async (tenantId: string): Promise<boolean> => {
  const tenant = await queries.tenants.getTenantById(tenantId);
  return tenant?.status === TENANT_STATUS.ACTIVE;
};

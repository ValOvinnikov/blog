import { listResolvableEntitlementGrants } from '@shinefold/db/queries/tenant-entitlement-grants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  resolveTenantEntitlements,
  type TTenantEntitlements,
} from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export async function readTenantEntitlements({
  id,
  plan,
}: Pick<TTenant, 'id' | 'plan'>): Promise<TTenantEntitlements> {
  const grants = await listResolvableEntitlementGrants(id);
  return resolveTenantEntitlements(plan, grants, new Date());
}

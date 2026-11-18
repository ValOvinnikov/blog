import { getDb } from '@shinefold/db/client';
import { isOpenGrantOf } from '@shinefold/db/queries/tenant-entitlement-grants/open-grant-condition';
import { tenantEntitlementGrants } from '@shinefold/db/schema/tenant-entitlement-grants';
import type { TResolvableGrant } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

/** The site's read: no granter join and no decryption, so a missing personal-data key cannot fail it. */
export async function listResolvableEntitlementGrants(
  tenantId: string,
): Promise<TResolvableGrant[]> {
  return getDb()
    .select({
      kind: tenantEntitlementGrants.kind,
      key: tenantEntitlementGrants.key,
      value: tenantEntitlementGrants.value,
      expiresAt: tenantEntitlementGrants.expiresAt,
      revokedAt: tenantEntitlementGrants.revokedAt,
    })
    .from(tenantEntitlementGrants)
    .where(isOpenGrantOf(tenantId));
}

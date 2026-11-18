import type { TMaybeNull } from '@shinefold/config';
import { getDb } from '@shinefold/db/client';
import { admins } from '@shinefold/db/schema/admins';
import { users } from '@shinefold/db/schema/auth';
import {
  tenantEntitlementGrants,
  type TTenantEntitlementGrant,
} from '@shinefold/db/schema/tenant-entitlement-grants';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { and, asc, eq, isNull } from 'drizzle-orm';

export type TListedEntitlementGrant = TTenantEntitlementGrant & {
  grantedByEmail: TMaybeNull<string>;
};

/** Every unrevoked grant, expired ones included, so an operator can see and close them. */
export async function listEntitlementGrants(
  tenantId: string,
): Promise<TListedEntitlementGrant[]> {
  const rows = await getDb()
    .select({
      grant: tenantEntitlementGrants,
      grantedByEmailEncrypted: users.emailEncrypted,
    })
    .from(tenantEntitlementGrants)
    .leftJoin(admins, eq(admins.id, tenantEntitlementGrants.grantedBy))
    .leftJoin(users, eq(users.id, admins.userId))
    .where(
      and(
        eq(tenantEntitlementGrants.tenantId, tenantId),
        isNull(tenantEntitlementGrants.revokedAt),
      ),
    )
    .orderBy(asc(tenantEntitlementGrants.grantedAt));

  return rows.map(({ grant, grantedByEmailEncrypted }) => ({
    ...grant,
    grantedByEmail: decryptOptionalPersonalValue(grantedByEmailEncrypted),
  }));
}

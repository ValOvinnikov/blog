import type { TMaybeNull } from '@shinefold/config';
import { getDb } from '@shinefold/db/client';
import { isOpenGrantOf } from '@shinefold/db/queries/tenant-entitlement-grants/open-grant-condition';
import { admins } from '@shinefold/db/schema/admins';
import { users } from '@shinefold/db/schema/auth';
import {
  tenantEntitlementGrants,
  type TTenantEntitlementGrant,
} from '@shinefold/db/schema/tenant-entitlement-grants';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { asc, eq } from 'drizzle-orm';

export type TListedEntitlementGrant = TTenantEntitlementGrant & {
  grantedByEmail: TMaybeNull<string>;
};

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
    .where(isOpenGrantOf(tenantId))
    .orderBy(asc(tenantEntitlementGrants.grantedAt));

  return rows.map(({ grant, grantedByEmailEncrypted }) => ({
    ...grant,
    grantedByEmail: decryptOptionalPersonalValue(grantedByEmailEncrypted),
  }));
}

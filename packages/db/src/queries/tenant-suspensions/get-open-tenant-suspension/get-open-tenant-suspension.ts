import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
import { getDb } from '@shinefold/db/client';
import { admins } from '@shinefold/db/schema/admins';
import { users } from '@shinefold/db/schema/auth';
import {
  tenantSuspensions,
  type TTenantSuspension,
} from '@shinefold/db/schema/tenant-suspensions';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { and, eq, isNull } from 'drizzle-orm';

export type TOpenTenantSuspension = TTenantSuspension & {
  suspendedByEmail: TMaybeNull<string>;
};

export async function getOpenTenantSuspension(
  tenantId: string,
): Promise<TMaybeUndefined<TOpenTenantSuspension>> {
  const [row] = await getDb()
    .select({
      suspension: tenantSuspensions,
      suspendedByEmailEncrypted: users.emailEncrypted,
    })
    .from(tenantSuspensions)
    .leftJoin(admins, eq(admins.id, tenantSuspensions.suspendedBy))
    .leftJoin(users, eq(users.id, admins.userId))
    .where(
      and(
        eq(tenantSuspensions.tenantId, tenantId),
        isNull(tenantSuspensions.liftedAt),
      ),
    );

  if (!row) return undefined;

  return {
    ...row.suspension,
    suspendedByEmail: decryptOptionalPersonalValue(
      row.suspendedByEmailEncrypted,
    ),
  };
}

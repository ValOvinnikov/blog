import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { getDb } from '@blog/db/client';
import { admins } from '@blog/db/schema/admins';
import { users } from '@blog/db/schema/auth';
import {
  tenantSuspensions,
  type TTenantSuspension,
} from '@blog/db/schema/tenant-suspensions';
import { decryptOptionalPersonalValue } from '@blog/db/utils/personal-data/personal-data';
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

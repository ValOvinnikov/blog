import type { TMaybeNull } from '@shinefold/config';
import type { TErrorCode } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { admins } from '@shinefold/db/schema/admins';
import { users } from '@shinefold/db/schema/auth';
import {
  blockedSignupIdentities,
  type TBlockedSignupIdentity,
} from '@shinefold/db/schema/blocked-signup-identities';
import { tenantSuspensions } from '@shinefold/db/schema/tenant-suspensions';
import { tenants } from '@shinefold/db/schema/tenants';
import { decryptOptionalPersonalValue } from '@shinefold/db/utils/personal-data/personal-data';
import { okResult, type TResult } from '@shinefold/utils';
import { desc, eq } from 'drizzle-orm';

export type TBlockingSuspension = {
  reference: string;
  tenantId: string;
  tenantName: string;
};

export type TBlockedIdentityListing = TBlockedSignupIdentity & {
  addedByEmail: TMaybeNull<string>;
  suspension: TMaybeNull<TBlockingSuspension>;
};

export async function listBlockedIdentities(): Promise<
  TResult<TBlockedIdentityListing[], TErrorCode>
> {
  const db = getDb();

  const rows = await db
    .select({
      entry: blockedSignupIdentities,
      addedByEmailEncrypted: users.emailEncrypted,
      suspensionReference: tenantSuspensions.reference,
      suspensionTenantId: tenants.id,
      suspensionTenantName: tenants.name,
    })
    .from(blockedSignupIdentities)
    .leftJoin(admins, eq(admins.id, blockedSignupIdentities.createdByAdminId))
    .leftJoin(users, eq(users.id, admins.userId))
    .leftJoin(
      tenantSuspensions,
      eq(tenantSuspensions.ownerBlockId, blockedSignupIdentities.id),
    )
    .leftJoin(tenants, eq(tenants.id, tenantSuspensions.tenantId))
    .orderBy(
      desc(blockedSignupIdentities.createdAt),
      desc(blockedSignupIdentities.id),
    );

  return okResult(
    rows.map(
      ({
        entry,
        addedByEmailEncrypted,
        suspensionReference,
        suspensionTenantId,
        suspensionTenantName,
      }) => ({
        ...entry,
        addedByEmail: decryptOptionalPersonalValue(addedByEmailEncrypted),
        suspension:
          suspensionReference && suspensionTenantId && suspensionTenantName
            ? {
                reference: suspensionReference,
                tenantId: suspensionTenantId,
                tenantName: suspensionTenantName,
              }
            : null,
      }),
    ),
  );
}

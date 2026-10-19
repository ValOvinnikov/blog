import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { getTenantOwnerAccess } from '@blog/db/queries/tenants/get-tenant-owner-access';
import {
  tenantOwnerAccessColumns,
  toTenantOwnerAccess,
  type TTenantOwnerAccess,
} from '@blog/db/queries/tenants/tenant-owner-access';
import { tenants } from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

// A field left out keeps its stored value; `null` clears it.
export type TSetTenantOwnerAccessInput = {
  [K in keyof TTenantOwnerAccess]?: TMaybeNull<
    Exclude<TTenantOwnerAccess[K], undefined>
  >;
};

export async function setTenantOwnerAccess(
  tenantId: string,
  input: TSetTenantOwnerAccessInput,
): Promise<TResult<TTenantOwnerAccess, TErrorCode>> {
  if (Object.values(input).every((value) => value === undefined)) {
    const ownerAccess = await getTenantOwnerAccess(tenantId);

    return ownerAccess
      ? { ok: true, data: ownerAccess }
      : { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  const db = getDb();

  const [row] = await db
    .update(tenants)
    .set({
      ownerSanityInviteId: input.sanityInviteId,
      ownerInviteSentAt: input.inviteSentAt,
      ownerInviteAcceptedAt: input.inviteAcceptedAt,
      ownerSanityUserId: input.sanityUserId,
      ownerLoginProvider: input.loginProvider,
      ownerSanityRole: input.sanityRole,
    })
    .where(eq(tenants.id, tenantId))
    .returning(tenantOwnerAccessColumns);

  if (!row) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: true, data: toTenantOwnerAccess(row) };
}

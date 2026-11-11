import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import type { TNullablePatch } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { getTenantOwnerAccess } from '@blog/db/queries/tenants/get-tenant-owner-access';
import {
  tenantOwnerAccessColumns,
  toTenantOwnerAccess,
  type TTenantOwnerAccess,
} from '@blog/db/queries/tenants/tenant-owner-access';
import { tenants } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { isUndefined } from '@blog/utils/primitives';
import { eq } from 'drizzle-orm';

export type TSetTenantOwnerAccessInput = TNullablePatch<TTenantOwnerAccess>;

export async function setTenantOwnerAccess(
  tenantId: string,
  input: TSetTenantOwnerAccessInput,
): Promise<TResult<TTenantOwnerAccess, TErrorCode>> {
  if (Object.values(input).every(isUndefined)) {
    const ownerAccess = await getTenantOwnerAccess(tenantId);

    return ownerAccess
      ? okResult(ownerAccess)
      : errorResult(ERROR_CODE.DB_NOT_FOUND);
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
      ownerInviteHeadsUpSentAt: input.inviteHeadsUpSentAt,
      ownerInviteNudgeSentAt: input.inviteNudgeSentAt,
      ownerSiteReadySentAt: input.siteReadySentAt,
    })
    .where(eq(tenants.id, tenantId))
    .returning(tenantOwnerAccessColumns);

  if (!row) {
    return errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  return okResult(toTenantOwnerAccess(row));
}

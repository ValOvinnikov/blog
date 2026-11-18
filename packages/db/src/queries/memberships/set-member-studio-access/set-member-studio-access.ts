import { ERROR_CODE, type TErrorCode } from '@shinefold/config/constants';
import type { TNullablePatch } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import {
  memberStudioAccessColumns,
  toMemberStudioAccess,
  type TMemberStudioAccess,
} from '@shinefold/db/queries/memberships/member-studio-access';
import { memberships } from '@shinefold/db/schema/memberships';
import { isUuid } from '@shinefold/db/utils/is-uuid/is-uuid';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { isUndefined } from '@shinefold/utils/primitives';
import { and, eq } from 'drizzle-orm';

export type TSetMemberStudioAccessInput = TNullablePatch<TMemberStudioAccess>;

export async function setMemberStudioAccess(
  tenantId: string,
  membershipId: string,
  input: TSetMemberStudioAccessInput,
): Promise<TResult<TMemberStudioAccess, TErrorCode>> {
  if (!isUuid(membershipId)) return errorResult(ERROR_CODE.DB_NOT_FOUND);

  const db = getDb();
  const isMembership = and(
    eq(memberships.id, membershipId),
    eq(memberships.tenantId, tenantId),
  );

  const [row] = Object.values(input).every(isUndefined)
    ? await db
        .select(memberStudioAccessColumns)
        .from(memberships)
        .where(isMembership)
    : await db
        .update(memberships)
        .set({
          sanityInviteId: input.sanityInviteId,
          sanityInviteSentAt: input.inviteSentAt,
          sanityInviteAcceptedAt: input.inviteAcceptedAt,
          sanityUserId: input.sanityUserId,
          sanityLoginProvider: input.loginProvider,
        })
        .where(isMembership)
        .returning(memberStudioAccessColumns);

  return row
    ? okResult(toMemberStudioAccess(row))
    : errorResult(ERROR_CODE.DB_NOT_FOUND);
}

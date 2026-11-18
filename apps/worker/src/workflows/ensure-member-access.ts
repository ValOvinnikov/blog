import type { TMaybeNull } from '@shinefold/config/types';
import type { TElevateTenantOwnerOutcome } from '@shinefold/db/constants';
import { OWNER_ACCESS_RUN_CHECKS } from '@worker/constants/owner-access';
import { checkMemberAccess } from '@worker/units/check-member-access';
import { pollAccess } from '@worker/utils/access-run/poll-access';
import { memberAccessHookToken } from '@worker/utils/member-access-hook/member-access-hook';

export async function ensureMemberAccess(
  tenantId: string,
  membershipId: string,
  maxChecks: number = OWNER_ACCESS_RUN_CHECKS,
): Promise<TMaybeNull<TElevateTenantOwnerOutcome>> {
  'use workflow';

  return pollAccess(
    memberAccessHookToken(tenantId, membershipId),
    () => checkMemberAccess(tenantId, membershipId),
    maxChecks,
  );
}

import type { TMaybeNull } from '@shinefold/config/types';
import type { TElevateTenantOwnerOutcome } from '@shinefold/db/constants';
import { OWNER_ACCESS_RUN_CHECKS } from '@worker/constants/owner-access';
import { checkOwnerAccess } from '@worker/units/check-owner-access';
import { pollAccess } from '@worker/utils/access-run/poll-access';
import { ownerAccessHookToken } from '@worker/utils/owner-access-hook/owner-access-hook';

export async function ensureOwnerAccess(
  tenantId: string,
  maxChecks: number = OWNER_ACCESS_RUN_CHECKS,
): Promise<TMaybeNull<TElevateTenantOwnerOutcome>> {
  'use workflow';

  return pollAccess(
    ownerAccessHookToken(tenantId),
    () => checkOwnerAccess(tenantId),
    maxChecks,
  );
}

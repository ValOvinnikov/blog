import { OWNER_ACCESS_RUN_CHECKS } from '@worker/constants/owner-access';
import { wakeAccessRun } from '@worker/utils/access-run/access-run';
import { memberAccessHookToken } from '@worker/utils/member-access-hook/member-access-hook';
import { ensureMemberAccess } from '@worker/workflows/ensure-member-access';
import { start } from 'workflow/api';

export async function wakeMemberAccess(
  tenantId: string,
  membershipId: string,
  maxChecks: number = OWNER_ACCESS_RUN_CHECKS,
): Promise<void> {
  await wakeAccessRun(memberAccessHookToken(tenantId, membershipId), () =>
    start(ensureMemberAccess, [tenantId, membershipId, maxChecks]),
  );
}

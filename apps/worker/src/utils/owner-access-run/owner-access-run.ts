import { OWNER_ACCESS_RUN_CHECKS } from '@worker/constants/owner-access';
import { wakeAccessRun } from '@worker/utils/access-run/access-run';
import { ownerAccessHookToken } from '@worker/utils/owner-access-hook/owner-access-hook';
import { ensureOwnerAccess } from '@worker/workflows/ensure-owner-access';
import { start } from 'workflow/api';

export async function wakeOwnerAccess(
  tenantId: string,
  maxChecks: number = OWNER_ACCESS_RUN_CHECKS,
): Promise<void> {
  await wakeAccessRun(ownerAccessHookToken(tenantId), () =>
    start(ensureOwnerAccess, [tenantId, maxChecks]),
  );
}

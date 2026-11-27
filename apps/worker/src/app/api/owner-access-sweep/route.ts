import { OWNER_ACCESS_LOG } from '@worker/constants/owner-access';
import { runCronSweep } from '@worker/utils/cron-request/cron-request';
import { runOwnerAccessSweep } from '@worker/utils/owner-access-sweep/run-owner-access-sweep';

// Next requires a literal here, so it cannot import a const.
export const maxDuration = 300;

export async function GET(request: Request): Promise<Response> {
  return runCronSweep(
    request,
    {
      notConfigured: OWNER_ACCESS_LOG.SWEEP_NOT_CONFIGURED,
      failed: OWNER_ACCESS_LOG.SWEEP_FAILED,
    },
    runOwnerAccessSweep,
  );
}

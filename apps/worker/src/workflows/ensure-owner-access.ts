import type { TMaybeNull } from '@blog/config/types';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import {
  OWNER_ACCESS_POLL_INTERVAL,
  OWNER_ACCESS_RUN_CHECKS,
} from '@worker/constants/owner-access';
import { checkOwnerAccess } from '@worker/units/check-owner-access';
import { ownerAccessHookToken } from '@worker/utils/owner-access-hook/owner-access-hook';
import { createHook, sleep } from 'workflow';

export async function ensureOwnerAccess(
  tenantId: string,
  maxChecks: number = OWNER_ACCESS_RUN_CHECKS,
): Promise<TMaybeNull<TElevateTenantOwnerOutcome>> {
  'use workflow';

  const wake = createHook<null>({ token: ownerAccessHookToken(tenantId) });
  try {
    if (await wake.getConflict()) return null;

    const wakes = wake[Symbol.asyncIterator]();
    let nextWake = wakes.next();
    for (let checks = 1; ; checks++) {
      const { outcome, hasFailed } = await checkOwnerAccess(tenantId);
      const isWaiting =
        outcome === ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE;
      if (!isWaiting || hasFailed || checks >= maxChecks) return outcome;

      const woken = await Promise.race([
        sleep(OWNER_ACCESS_POLL_INTERVAL).then(() => false),
        nextWake.then(() => true),
      ]);
      if (woken) nextWake = wakes.next();
    }
  } finally {
    wake.dispose();
  }
}

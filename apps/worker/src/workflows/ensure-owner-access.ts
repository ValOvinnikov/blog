import type { TMaybeNull } from '@blog/config/types';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import {
  OWNER_ACCESS_FAST_POLL_INTERVAL,
  OWNER_ACCESS_FAST_POLL_TICKS,
  OWNER_ACCESS_SLOW_POLL_INTERVAL,
} from '@worker/constants/owner-access';
import { checkOwnerAccess } from '@worker/units/check-owner-access';
import { ownerAccessHookToken } from '@worker/utils/owner-access-hook/owner-access-hook';
import { createHook, sleep } from 'workflow';

function pollInterval(tick: number) {
  return tick < OWNER_ACCESS_FAST_POLL_TICKS
    ? OWNER_ACCESS_FAST_POLL_INTERVAL
    : OWNER_ACCESS_SLOW_POLL_INTERVAL;
}

export async function ensureOwnerAccess(
  tenantId: string,
): Promise<TMaybeNull<TElevateTenantOwnerOutcome>> {
  'use workflow';

  const wake = createHook<null>({ token: ownerAccessHookToken(tenantId) });
  try {
    if (await wake.getConflict()) return null;

    const wakes = wake[Symbol.asyncIterator]();
    let nextWake = wakes.next();
    let tick = 0;
    for (;;) {
      const outcome = await checkOwnerAccess(tenantId);
      if (outcome !== ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE) {
        return outcome;
      }

      const woken = await Promise.race([
        sleep(pollInterval(tick)).then(() => false),
        nextWake.then(() => true),
      ]);
      if (woken) nextWake = wakes.next();
      tick = woken ? 0 : tick + 1;
    }
  } finally {
    wake.dispose();
  }
}

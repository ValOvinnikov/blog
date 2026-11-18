import type { TMaybeNull } from '@shinefold/config/types';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  type TElevateTenantOwnerOutcome,
} from '@shinefold/db/constants';
import { OWNER_ACCESS_POLL_INTERVAL_MS } from '@worker/constants/owner-access';
import { createHook, sleep } from 'workflow';

export type TAccessCheck = {
  outcome: TMaybeNull<TElevateTenantOwnerOutcome>;
  hasFailed: boolean;
};

// Runs inside a `'use workflow'` function, which supplies the durable `createHook` and `sleep`.
export async function pollAccess(
  hookToken: string,
  check: () => Promise<TAccessCheck>,
  maxChecks: number,
): Promise<TMaybeNull<TElevateTenantOwnerOutcome>> {
  const wake = createHook<null>({ token: hookToken });
  try {
    if (await wake.getConflict()) return null;

    const wakes = wake[Symbol.asyncIterator]();
    let nextWake = wakes.next();
    for (let checks = 1; ; checks++) {
      const { outcome, hasFailed } = await check();
      const isWaiting =
        outcome === ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE;
      if (!isWaiting || hasFailed || checks >= maxChecks) return outcome;

      const woken = await Promise.race([
        sleep(OWNER_ACCESS_POLL_INTERVAL_MS).then(() => false),
        nextWake.then(() => true),
      ]);
      if (woken) nextWake = wakes.next();
    }
  } finally {
    wake.dispose();
  }
}

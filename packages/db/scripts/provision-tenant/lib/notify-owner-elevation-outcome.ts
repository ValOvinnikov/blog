import type { TElevateTenantOwnerOutcome } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import {
  isNotifiableOutcome,
  notifyOperatorsOfOwnerElevationOutcome,
} from '../../recheck-tenant-owners/lib/notify-operators';

export type TNotifyOwnerElevationOutcomeParams = {
  tenant: TTenant;
  outcome: TElevateTenantOwnerOutcome;
};

/**
 * Notifies operators of a notifiable owner-elevation outcome exactly once —
 * dedup keys on `tenant.lastNotifiedOwnerElevationOutcome`, the outcome
 * actually communicated last time, not the most recently observed one, so a
 * provisioning-time notification and a later recheck sweep never both fire
 * for the same outcome. Called by both `provision-tenant/run.ts` and
 * `recheck-tenant-owners/run.ts`. Returns the outcome once it has actually
 * been sent, so the caller can persist `detail` and
 * `notifiedOwnerElevationOutcome` together in a single
 * `reportOwnerElevationOutcome` write; returns `undefined` when nothing was
 * sent, leaving that write to record `detail` alone.
 */
export async function notifyOwnerElevationOutcome({
  tenant,
  outcome,
}: TNotifyOwnerElevationOutcomeParams): Promise<
  TElevateTenantOwnerOutcome | undefined
> {
  if (
    !isNotifiableOutcome(outcome) ||
    outcome === tenant.lastNotifiedOwnerElevationOutcome
  ) {
    return undefined;
  }

  await notifyOperatorsOfOwnerElevationOutcome({
    tenant,
    outcome,
  });

  return outcome;
}

import { OPERATOR_ALERT_KIND } from '@blog/config/constants';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { postOperatorAlert } from '../../lib/post-operator-alert';

// The only two outcomes this function is ever called with — the caller
// guarantees it, since the other three outcomes are never actionable.
export type TNotifiableOutcome = Extract<
  TElevateTenantOwnerOutcome,
  'STALLED' | 'AMBIGUOUS_MEMBERSHIP'
>;

export function isNotifiableOutcome(
  outcome: TElevateTenantOwnerOutcome,
): outcome is TNotifiableOutcome {
  return (
    outcome === ELEVATE_TENANT_OWNER_OUTCOME.STALLED ||
    outcome === ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP
  );
}

type TNotifyOperatorsParams = {
  tenant: TTenant;
  outcome: TNotifiableOutcome;
};

/**
 * Reports a notifiable owner-elevation outcome to the platform for operator
 * notification — `notifyOwnerElevationOutcome` is the sole caller and is
 * responsible for the de-dup check against the previously persisted
 * outcome. Never throws: a notification failure must never fail the sweep
 * it's reporting on.
 */
export async function notifyOperatorsOfOwnerElevationOutcome({
  tenant,
  outcome,
}: TNotifyOperatorsParams): Promise<void> {
  await postOperatorAlert({
    kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
    tenantId: tenant.id,
    outcome,
  });
}

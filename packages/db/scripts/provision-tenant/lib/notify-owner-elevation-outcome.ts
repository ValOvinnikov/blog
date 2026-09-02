import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import {
  isNotifiableOutcome,
  notifyOperatorsOfOwnerElevationOutcome,
} from '../../recheck-tenant-owners/lib/notify-operators';

import { reportStepStatus } from './report-step-status';

export type TNotifyOwnerElevationOutcomeParams = {
  tenant: TTenant;
  outcome: TElevateTenantOwnerOutcome;
  resendApiKey: string | undefined;
};

/**
 * Notifies operators of a notifiable owner-elevation outcome exactly once —
 * dedup keys on `tenant.lastNotifiedOwnerElevationOutcome`, the outcome
 * actually communicated last time, not the most recently observed one, so a
 * provisioning-time notification and a later recheck sweep never both fire
 * for the same outcome. Called by both `provision-tenant/run.ts` and
 * `recheck-tenant-owners/run.ts`.
 */
export async function notifyOwnerElevationOutcome({
  tenant,
  outcome,
  resendApiKey,
}: TNotifyOwnerElevationOutcomeParams): Promise<void> {
  if (
    !isNotifiableOutcome(outcome) ||
    outcome === tenant.lastNotifiedOwnerElevationOutcome
  ) {
    return;
  }

  await notifyOperatorsOfOwnerElevationOutcome({
    tenant,
    outcome,
    resendApiKey,
  });

  await reportStepStatus({
    tenantId: tenant.id,
    step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    detail: outcome,
    notifiedOwnerElevationOutcome: outcome,
  });
}

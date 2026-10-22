import {
  DEPROVISIONING_STEP,
  type TDeprovisioningStep,
} from '@blog/db/constants';
import { UNKNOWN_RUN_ERROR } from '@worker/constants/provisioning';
import {
  beginDeprovisioning,
  finishDeprovisioning,
  type TDeprovisioningOutcome,
} from '@worker/units/deprovisioning-lifecycle';
import { runDeprovisioningStep } from '@worker/units/run-deprovisioning-step';
import type { TUnitContext } from '@worker/units/run-reported-step';

const DEPROVISIONING_ORDER: TDeprovisioningStep[] = [
  DEPROVISIONING_STEP.REMOVE_DOMAIN,
  DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
  DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS,
  DEPROVISIONING_STEP.CLEAR_ARTIFACTS,
  DEPROVISIONING_STEP.ARCHIVE_TENANT,
  DEPROVISIONING_STEP.PURGE_READER_DATA,
  DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE,
];

export async function runDeprovisioningSequence(
  tenantId: string,
  ctx: TUnitContext,
): Promise<TDeprovisioningOutcome> {
  if (!(await beginDeprovisioning(tenantId))) {
    return { ok: true, skipped: true };
  }

  let outcome: TDeprovisioningOutcome = { ok: true };
  try {
    for (const step of DEPROVISIONING_ORDER) {
      const result = await runDeprovisioningStep(tenantId, ctx, step);
      if (!result.ok) {
        outcome = result;
        break;
      }
    }
  } catch (error) {
    outcome = {
      ok: false,
      error: error instanceof Error ? error.message : UNKNOWN_RUN_ERROR,
    };
  }

  await finishDeprovisioning(tenantId, ctx, outcome);
  return outcome;
}

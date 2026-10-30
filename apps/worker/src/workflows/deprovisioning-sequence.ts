import { CORE_DEPROVISIONING_STEPS } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils/result';
import { UNKNOWN_RUN_ERROR } from '@worker/constants/provisioning';
import {
  beginDeprovisioning,
  finishDeprovisioning,
  type TDeprovisioningOutcome,
} from '@worker/units/deprovisioning-lifecycle';
import { runDeprovisioningStep } from '@worker/units/run-deprovisioning-step';
import type { TUnitContext } from '@worker/units/run-reported-step';

export async function runDeprovisioningSequence(
  tenantId: string,
  ctx: TUnitContext,
): Promise<TDeprovisioningOutcome> {
  if (!(await beginDeprovisioning(tenantId))) {
    return okResult({ skipped: true });
  }

  let outcome: TDeprovisioningOutcome = okResult({ skipped: false });
  try {
    for (const step of CORE_DEPROVISIONING_STEPS) {
      const result = await runDeprovisioningStep(tenantId, ctx, step);
      if (!result.ok) {
        outcome = errorResult({ failedStep: result.error });
        break;
      }
    }
  } catch (error) {
    outcome = errorResult({
      message: error instanceof Error ? error.message : UNKNOWN_RUN_ERROR,
    });
  }

  await finishDeprovisioning(tenantId, ctx, outcome);
  return outcome;
}

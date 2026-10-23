import { errorResult, okResult } from '@blog/utils/result';
import { UNKNOWN_RUN_ERROR } from '@worker/constants/provisioning';
import { applySiteTemplate } from '@worker/units/apply-site-template';
import { ensureInfrastructure } from '@worker/units/ensure-infrastructure';
import { inviteOwner } from '@worker/units/invite-owner';
import {
  beginRun,
  finishRun,
  type TRunOutcome,
} from '@worker/units/run-lifecycle';
import type { TUnitContext } from '@worker/units/run-reported-step';
import { verifyTenant } from '@worker/units/verify-tenant';

export async function runProvisioningSequence(
  tenantId: string,
  ctx: TUnitContext,
): Promise<TRunOutcome> {
  const units = [
    () => ensureInfrastructure(tenantId, ctx),
    () => inviteOwner(tenantId, ctx),
    () => applySiteTemplate(tenantId, ctx),
    () => verifyTenant(tenantId, ctx),
  ];

  let outcome: TRunOutcome = okResult();
  try {
    await beginRun(tenantId);
    for (const unit of units) {
      const result = await unit();
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

  await finishRun(tenantId, ctx, outcome);
  return outcome;
}

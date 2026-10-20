import { applySiteTemplate } from '@worker/units/apply-site-template';
import { ensureInfrastructure } from '@worker/units/ensure-infrastructure';
import { inviteOwner } from '@worker/units/invite-owner';
import {
  beginRun,
  finishRun,
  type TRunOutcome,
} from '@worker/units/run-lifecycle';
import { verifyTenant } from '@worker/units/verify-tenant';
import { FatalError, getWorkflowMetadata } from 'workflow';

export async function provisionTenant(tenantId: string): Promise<TRunOutcome> {
  'use workflow';

  const ctx = { runId: getWorkflowMetadata().workflowRunId };
  const units = [
    () => ensureInfrastructure(tenantId, ctx),
    () => inviteOwner(tenantId),
    () => applySiteTemplate(tenantId, ctx),
    () => verifyTenant(tenantId, ctx),
  ];

  let outcome: TRunOutcome = { ok: true };
  try {
    await beginRun(tenantId);
    for (const unit of units) {
      const result = await unit();
      if (!result.ok) {
        outcome = result;
        break;
      }
    }
  } catch (error) {
    outcome = {
      ok: false,
      error: error instanceof Error ? error.message : 'unknown',
    };
  }

  await finishRun(tenantId, ctx, outcome);
  if (!outcome.ok) {
    throw new FatalError(`Provisioning failed for tenant "${tenantId}".`);
  }
  return outcome;
}

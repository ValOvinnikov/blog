import type { TRunOutcome } from '@worker/units/run-lifecycle';
import { startOwnerAccess } from '@worker/units/start-owner-access';
import { FatalError, getWorkflowMetadata } from 'workflow';

import { runProvisioningSequence } from './provisioning-sequence';

export async function provisionTenant(tenantId: string): Promise<TRunOutcome> {
  'use workflow';

  const ctx = { runId: getWorkflowMetadata().workflowRunId };
  const outcome = await runProvisioningSequence(tenantId, ctx);

  if (outcome.ok) {
    await startOwnerAccess(tenantId, ctx);
  } else {
    throw new FatalError(`Provisioning failed for tenant "${tenantId}".`);
  }
  return outcome;
}

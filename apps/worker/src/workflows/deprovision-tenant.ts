import type { TDeprovisioningOutcome } from '@worker/units/deprovisioning-lifecycle';
import { FatalError, getWorkflowMetadata } from 'workflow';

import { runDeprovisioningSequence } from './deprovisioning-sequence';

export async function deprovisionTenant(
  tenantId: string,
): Promise<TDeprovisioningOutcome> {
  'use workflow';

  const ctx = { runId: getWorkflowMetadata().workflowRunId };
  const outcome = await runDeprovisioningSequence(tenantId, ctx);

  if (!outcome.ok) {
    throw new FatalError(`Deprovisioning failed for tenant "${tenantId}".`);
  }
  return outcome;
}

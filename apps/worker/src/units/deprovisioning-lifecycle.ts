import type { TDeprovisioningStep } from '@blog/db/constants';
import { sanitizeLogMessage } from '@blog/insight';
import { DEPROVISIONING_RUN_FAILED_EVENT } from '@worker/constants/deprovisioning';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import {
  reportDeprovisioningRunFinish,
  reportDeprovisioningRunStart,
} from '@worker/utils/deprovisioning-report/deprovisioning-report';
import { logger } from '@worker/utils/logger/logger';
import { alertOperatorsToDeleteSanityProject } from '@worker/utils/operator-email/sanity-project-deletion-alert';

import type { TRunOutcome } from './run-lifecycle';
import { loadTenant, type TUnitContext } from './run-reported-step';

export type TDeprovisioningOutcome = TRunOutcome<
  TDeprovisioningStep,
  { skipped: boolean }
>;

export async function beginDeprovisioning(tenantId: string): Promise<boolean> {
  'use step';

  const { deprovisionedAt } = await loadTenant(tenantId);
  if (deprovisionedAt) return false;

  await reportDeprovisioningRunStart(tenantId);
  return true;
}

beginDeprovisioning.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;

export async function finishDeprovisioning(
  tenantId: string,
  ctx: TUnitContext,
  outcome: TDeprovisioningOutcome,
): Promise<void> {
  'use step';

  await reportDeprovisioningRunFinish(tenantId);
  if (outcome.ok) {
    await alertOperatorsToDeleteSanityProject(await loadTenant(tenantId));
  } else if ('message' in outcome.error) {
    logger.error(DEPROVISIONING_RUN_FAILED_EVENT, {
      tenantId,
      runId: ctx.runId,
      error: sanitizeLogMessage(outcome.error.message),
    });
  }
}

finishDeprovisioning.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;

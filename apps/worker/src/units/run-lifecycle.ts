import { AUDIT_ACTION } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STATUS,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import { setTenantProvisioningStatus } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import {
  PROVISIONING_UNIT_MAX_RETRIES,
  UNKNOWN_RUN_ERROR,
} from '@worker/constants/provisioning';
import { logger } from '@worker/utils/logger/logger';
import {
  recordProvisioningAuditEvent,
  reportRunFinish,
  reportRunStart,
} from '@worker/utils/provisioning-report/provisioning-report';

import type { TUnitContext } from './run-reported-step';

export type TRunOutcome =
  | { ok: true }
  | { ok: false; failedStep?: TTenantProvisioningStep; error?: string };

export async function beginRun(tenantId: string): Promise<void> {
  'use step';

  await reportRunStart(tenantId);
}

beginRun.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;

export async function finishRun(
  tenantId: string,
  ctx: TUnitContext,
  outcome: TRunOutcome,
): Promise<void> {
  'use step';

  const { runId } = ctx;
  await reportRunFinish(tenantId);

  if (!outcome.ok && outcome.failedStep === undefined) {
    logger.error('provisioning.run_failed', {
      tenantId,
      runId,
      error: sanitizeLogMessage(outcome.error ?? UNKNOWN_RUN_ERROR),
    });
    const marked = await setTenantProvisioningStatus(
      tenantId,
      TENANT_PROVISIONING_STATUS.FAILED,
    );
    if (!marked.ok) {
      logger.error('provisioning.mark_failed_failed', {
        tenantId,
        runId,
        error: marked.error,
      });
    }
  }

  await recordProvisioningAuditEvent({
    tenantId,
    runId,
    action: outcome.ok
      ? AUDIT_ACTION.PROVISIONED
      : AUDIT_ACTION.PROVISIONING_FAILED,
    ...(outcome.ok || outcome.failedStep === undefined
      ? {}
      : { failedStep: outcome.failedStep }),
  });
}

finishRun.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;

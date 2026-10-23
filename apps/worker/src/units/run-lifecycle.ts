import { AUDIT_ACTION } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STATUS,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import { setTenantProvisioningStatus } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import type { TResult } from '@blog/utils/result';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { logger } from '@worker/utils/logger/logger';
import {
  recordProvisioningAuditEvent,
  reportRunFinish,
  reportRunStart,
} from '@worker/utils/provisioning-report/provisioning-report';

import type { TUnitContext } from './run-reported-step';

type TRunFailure<TStep extends string = TTenantProvisioningStep> =
  { failedStep: TStep } | { message: string };

export type TRunOutcome<
  TStep extends string = TTenantProvisioningStep,
  T = void,
> = TResult<T, TRunFailure<TStep>>;

export function isStepFailure<TStep extends string>(
  failure: TRunFailure<TStep>,
): failure is { failedStep: TStep } {
  return 'failedStep' in failure;
}

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

  if (!outcome.ok && !isStepFailure(outcome.error)) {
    logger.error('provisioning.run_failed', {
      tenantId,
      runId,
      error: sanitizeLogMessage(outcome.error.message),
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
    ...(outcome.ok || !isStepFailure(outcome.error)
      ? {}
      : { failedStep: outcome.error.failedStep }),
  });
}

finishRun.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;

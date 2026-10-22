import type { TAuditAction } from '@blog/config/constants';
import type {
  TDeprovisioningStep,
  TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import {
  finishDeprovisioningRun,
  startDeprovisioningRun,
  updateDeprovisioningStep,
} from '@blog/db/queries/tenants';
import {
  DEPROVISIONING_AUDIT_VIA,
  DEPROVISIONING_STEP_FAILED_EVENT,
} from '@worker/constants/deprovisioning';
import type { TStepReporter } from '@worker/units/run-reported-step';
import { logger } from '@worker/utils/logger/logger';
import { insertWorkerAuditEvent } from '@worker/utils/provisioning-report/provisioning-report';

async function reportDeprovisioningStep(input: {
  tenantId: string;
  step: TDeprovisioningStep;
  status: TTenantProvisioningStepStatus;
  error?: string;
}): Promise<void> {
  const result = await updateDeprovisioningStep(input);
  if (!result.ok) {
    logger.error('deprovisioning.report_step_failed', {
      tenantId: input.tenantId,
      step: input.step,
      status: input.status,
      error: result.error,
    });
  }
}

export const DEPROVISIONING_STEP_REPORTER: TStepReporter<TDeprovisioningStep> =
  {
    failedEvent: DEPROVISIONING_STEP_FAILED_EVENT,
    report: reportDeprovisioningStep,
  };

export async function reportDeprovisioningRunStart(
  tenantId: string,
): Promise<void> {
  const result = await startDeprovisioningRun({ tenantId });
  if (!result.ok) {
    logger.error('deprovisioning.report_run_start_failed', {
      tenantId,
      error: result.error,
    });
  }
}

export async function reportDeprovisioningRunFinish(
  tenantId: string,
): Promise<void> {
  const result = await finishDeprovisioningRun({ tenantId });
  if (!result.ok) {
    logger.error('deprovisioning.report_run_finish_failed', {
      tenantId,
      error: result.error,
    });
  }
}

export async function recordDeprovisioningAuditEvent(input: {
  tenantId: string;
  runId: string;
  action: TAuditAction;
  details?: Record<string, number>;
}): Promise<void> {
  const { tenantId, runId, action, details } = input;
  await insertWorkerAuditEvent({
    tenantId,
    action,
    details: { via: DEPROVISIONING_AUDIT_VIA, runId, ...details },
  });
}

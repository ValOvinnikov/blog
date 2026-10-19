import { AUDIT_TARGET_TYPE, type TAuditAction } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events';
import {
  finishProvisioningRun,
  startProvisioningRun,
  updateProvisioningStep,
} from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import {
  PROVISIONING_AUDIT_ACTOR_EMAIL,
  PROVISIONING_AUDIT_ACTOR_ID,
  PROVISIONING_AUDIT_VIA,
} from '@worker/constants/provisioning';
import { overallStatusFor } from '@worker/utils/db-provisioning-steps/db-provisioning-steps';
import { logger } from '@worker/utils/logger/logger';

export async function reportStep(input: {
  tenantId: string;
  step: TTenantProvisioningStep;
  status: TTenantProvisioningStepStatus;
  error?: string;
}): Promise<void> {
  const { tenantId, step, status, error } = input;
  const provisioningStatus = overallStatusFor(step, status);

  const result = await updateProvisioningStep({
    tenantId,
    step,
    status,
    ...(error === undefined ? {} : { error }),
    ...(provisioningStatus === undefined ? {} : { provisioningStatus }),
  });

  if (!result.ok) {
    logger.error('provisioning.report_step_failed', {
      tenantId,
      step,
      status,
      error: result.error,
    });
  }
}

export async function reportRunStart(tenantId: string): Promise<void> {
  const result = await startProvisioningRun({ tenantId });
  if (!result.ok) {
    logger.error('provisioning.report_run_start_failed', {
      tenantId,
      error: result.error,
    });
  }
}

export async function reportRunFinish(tenantId: string): Promise<void> {
  const result = await finishProvisioningRun({ tenantId });
  if (!result.ok) {
    logger.error('provisioning.report_run_finish_failed', {
      tenantId,
      error: result.error,
    });
  }
}

export async function recordProvisioningAuditEvent(input: {
  tenantId: string;
  action: TAuditAction;
  runId: string;
  failedStep?: TTenantProvisioningStep;
}): Promise<void> {
  const { tenantId, action, runId, failedStep } = input;
  try {
    await insertAuditEvent({
      actorId: PROVISIONING_AUDIT_ACTOR_ID,
      actorEmail: PROVISIONING_AUDIT_ACTOR_EMAIL,
      action,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: tenantId,
      details: {
        via: PROVISIONING_AUDIT_VIA,
        runId,
        ...(failedStep === undefined ? {} : { step: failedStep }),
      },
    });
  } catch (error) {
    logger.error('provisioning.audit_event_failed', {
      tenantId,
      action,
      error: sanitizeLogMessage(error),
    });
  }
}

export async function markRunNotStarted(tenantId: string): Promise<void> {
  await reportStep({
    tenantId,
    step: TENANT_PROVISIONING_STEP.SANITY_PROJECT,
    status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
    error: 'The provisioning run could not be started.',
  });
  await reportRunFinish(tenantId);
}

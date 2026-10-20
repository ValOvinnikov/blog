import {
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { logger } from '@worker/utils/logger/logger';
import { reportStep } from '@worker/utils/provisioning-report/provisioning-report';
import { FatalError, getStepMetadata } from 'workflow';

export type TUnitContext = { runId: string };

export type TUnitResult =
  { ok: true } | { ok: false; failedStep: TTenantProvisioningStep };

export async function loadTenant(tenantId: string): Promise<TTenant> {
  const tenant = await getTenantById(tenantId, { includeArchived: true });
  if (!tenant) {
    throw new FatalError(`Tenant "${tenantId}" does not exist.`);
  }
  return tenant;
}

export function isFinalStepAttempt(error: unknown): boolean {
  return (
    FatalError.is(error) ||
    getStepMetadata().attempt > PROVISIONING_UNIT_MAX_RETRIES
  );
}

export async function runReportedStep(input: {
  tenantId: string;
  ctx: TUnitContext;
  step: TTenantProvisioningStep;
  run: () => Promise<void>;
}): Promise<TUnitResult> {
  const { tenantId, ctx, step, run } = input;

  await reportStep({
    tenantId,
    step,
    status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  });

  try {
    await run();
  } catch (error) {
    if (!isFinalStepAttempt(error)) throw error;

    const message = sanitizeLogMessage(error);
    logger.error('provisioning.step_failed', {
      tenantId,
      runId: ctx.runId,
      step,
      error: message,
    });
    await reportStep({
      tenantId,
      step,
      status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      error: message,
    });
    return { ok: false, failedStep: step };
  }

  await reportStep({
    tenantId,
    step,
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  });
  return { ok: true };
}

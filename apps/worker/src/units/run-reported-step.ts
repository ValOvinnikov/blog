import {
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { errorResult, okResult, type TResult } from '@blog/utils/result';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { logger } from '@worker/utils/logger/logger';
import { reportStep } from '@worker/utils/provisioning-report/provisioning-report';
import { FatalError, getStepMetadata } from 'workflow';

export type TUnitContext = { runId: string; isOneShot?: boolean };

export type TUnitResult<TStep extends string = TTenantProvisioningStep> =
  TResult<void, TStep>;

export type TStepReporter<TStep extends string> = {
  failedEvent: string;
  report: (input: {
    tenantId: string;
    step: TStep;
    status: TTenantProvisioningStepStatus;
    error?: string;
  }) => Promise<void>;
};

type TReportedStepInput<TStep extends string> = {
  tenantId: string;
  ctx: TUnitContext;
  step: TStep;
  run: () => Promise<void>;
};

const PROVISIONING_STEP_REPORTER: TStepReporter<TTenantProvisioningStep> = {
  failedEvent: 'provisioning.step_failed',
  report: reportStep,
};

export async function loadTenant(tenantId: string): Promise<TTenant> {
  const tenant = await getTenantById(tenantId, { includeArchived: true });
  if (!tenant) {
    throw new FatalError(`Tenant "${tenantId}" does not exist.`);
  }
  return tenant;
}

export function isFinalStepAttempt(
  error: unknown,
  ctx?: TUnitContext,
): boolean {
  return (
    ctx?.isOneShot === true ||
    FatalError.is(error) ||
    getStepMetadata().attempt > PROVISIONING_UNIT_MAX_RETRIES
  );
}

export async function runReportedStep(
  input: TReportedStepInput<TTenantProvisioningStep>,
): Promise<TUnitResult> {
  return runStepWithReporter(PROVISIONING_STEP_REPORTER, input);
}

export async function runStepWithReporter<TStep extends string>(
  reporter: TStepReporter<TStep>,
  input: TReportedStepInput<TStep>,
): Promise<TUnitResult<TStep>> {
  const { tenantId, ctx, step, run } = input;
  const { failedEvent, report } = reporter;

  await report({
    tenantId,
    step,
    status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
  });

  try {
    await run();
  } catch (error) {
    if (!isFinalStepAttempt(error, ctx)) throw error;

    const message = sanitizeLogMessage(error);
    logger.error(failedEvent, {
      tenantId,
      runId: ctx.runId,
      step,
      error: message,
    });
    await report({
      tenantId,
      step,
      status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      error: message,
    });
    return errorResult(step);
  }

  await report({
    tenantId,
    step,
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  });
  return okResult();
}

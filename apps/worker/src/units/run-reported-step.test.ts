import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { updateProvisioningStep } from '@blog/db/queries/tenants';
import { errorResult } from '@blog/utils/result';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { MOCK_RUN_CONTEXT } from '@worker/testing/run/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { FatalError, getStepMetadata } from 'workflow';

import { runReportedStep } from './run-reported-step';

const STEP = TENANT_PROVISIONING_STEP.CREATE_WEBHOOK;
const SANITY_TIMED_OUT = 'sanity timed out';
const STILL_DOWN = 'still down';

vi.mock('@blog/db/queries/tenants');
vi.mock('workflow');

function reportedStatuses(): string[] {
  return vi
    .mocked(updateProvisioningStep)
    .mock.calls.map(([input]) => input.status);
}

describe(runReportedStep, () => {
  beforeEach(() => {
    atStepAttempt(1);
    vi.mocked(updateProvisioningStep).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );
  });

  function run(work: () => Promise<void>) {
    return runReportedStep({
      tenantId: MOCK_TENANT_ID,
      ctx: MOCK_RUN_CONTEXT,
      step: STEP,
      run: work,
    });
  }

  it('reports the step running, then done, and succeeds', async () => {
    const result = await run(async () => {});

    expect(result).toEqual({ ok: true, data: undefined });
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.DONE,
    ]);
    expect(updateProvisioningStep).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      step: STEP,
      status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    });
  });

  it('rethrows a failure within the retry budget without recording FAILED', async () => {
    atStepAttempt(PROVISIONING_UNIT_MAX_RETRIES);
    const failure = new Error(SANITY_TIMED_OUT);

    await expect(run(() => Promise.reject(failure))).rejects.toBe(failure);

    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    ]);
  });

  it('records FAILED once on the final attempt and names the failed step', async () => {
    atStepAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);

    const result = await run(() => Promise.reject(new Error(STILL_DOWN)));

    expect(result).toEqual({ ok: false, error: STEP });
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.FAILED,
    ]);
    expect(updateProvisioningStep).toHaveBeenLastCalledWith({
      tenantId: MOCK_TENANT_ID,
      step: STEP,
      status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
      provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
      error: STILL_DOWN,
    });
  });

  it('records FAILED immediately for a fatal error on the first attempt', async () => {
    const result = await run(() =>
      Promise.reject(new FatalError('missing credentials')),
    );

    expect(result).toEqual({ ok: false, error: STEP });
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.FAILED,
    ]);
  });

  it('records FAILED on the first failure of a one-shot run', async () => {
    vi.mocked(getStepMetadata).mockImplementation(() => {
      throw new Error('not in a step context');
    });

    const result = await runReportedStep({
      tenantId: MOCK_TENANT_ID,
      ctx: { ...MOCK_RUN_CONTEXT, isOneShot: true },
      step: STEP,
      run: () => Promise.reject(new Error(SANITY_TIMED_OUT)),
    });

    expect(result).toEqual({ ok: false, error: STEP });
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.FAILED,
    ]);
  });
});

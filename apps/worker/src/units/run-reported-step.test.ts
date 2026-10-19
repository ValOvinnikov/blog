import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { updateProvisioningStep } from '@blog/db/queries/tenants';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { FatalError, getStepMetadata } from 'workflow';

import { runReportedStep } from './run-reported-step';

const TENANT_ID = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b';
const STEP = TENANT_PROVISIONING_STEP.CREATE_WEBHOOK;

vi.mock('@worker/utils/logger/logger');
vi.mock('@blog/db/queries/tenants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/db/queries/tenants')>()),
  updateProvisioningStep: vi.fn(),
}));
vi.mock('workflow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('workflow')>()),
  getStepMetadata: vi.fn(),
}));

function atAttempt(attempt: number): void {
  vi.mocked(getStepMetadata).mockReturnValue({
    attempt,
  } as ReturnType<typeof getStepMetadata>);
}

function reportedStatuses(): string[] {
  return vi
    .mocked(updateProvisioningStep)
    .mock.calls.map(([input]) => input.status);
}

describe(runReportedStep, () => {
  beforeEach(() => {
    atAttempt(1);
    vi.mocked(updateProvisioningStep).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
  });

  function run(work: () => Promise<void>) {
    return runReportedStep({
      tenantId: TENANT_ID,
      ctx: { runId: 'run-1' },
      step: STEP,
      run: work,
    });
  }

  it('reports the step running, then done, and succeeds', async () => {
    const result = await run(async () => {});

    expect(result).toEqual({ ok: true });
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.DONE,
    ]);
    expect(updateProvisioningStep).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID, step: STEP }),
    );
  });

  it('rethrows a failure within the retry budget without recording FAILED', async () => {
    atAttempt(PROVISIONING_UNIT_MAX_RETRIES);
    const failure = new Error('sanity timed out');

    await expect(run(() => Promise.reject(failure))).rejects.toBe(failure);

    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    ]);
  });

  it('records FAILED once on the final attempt and names the failed step', async () => {
    atAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);

    const result = await run(() => Promise.reject(new Error('still down')));

    expect(result).toEqual({ ok: false, failedStep: STEP });
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.FAILED,
    ]);
    expect(updateProvisioningStep).toHaveBeenLastCalledWith(
      expect.objectContaining({ error: expect.stringContaining('still down') }),
    );
  });

  it('records FAILED immediately for a fatal error on the first attempt', async () => {
    const result = await run(() =>
      Promise.reject(new FatalError('missing credentials')),
    );

    expect(result).toEqual({ ok: false, failedStep: STEP });
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.FAILED,
    ]);
  });

  it('still completes the step when recording its progress fails', async () => {
    const result = await run(async () => {});

    expect(result).toEqual({ ok: true });
  });
});

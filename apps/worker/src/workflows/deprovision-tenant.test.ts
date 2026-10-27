import { DEPROVISIONING_STEP } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils/result';
import { MOCK_WORKFLOW_CRASH } from '@worker/testing/outage/fixtures';
import { MOCK_RUN_CONTEXT } from '@worker/testing/run/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import {
  beginDeprovisioning,
  finishDeprovisioning,
} from '@worker/units/deprovisioning-lifecycle';
import { runDeprovisioningStep } from '@worker/units/run-deprovisioning-step';
import { FatalError, getWorkflowMetadata } from 'workflow';

import { deprovisionTenant } from './deprovision-tenant';

vi.mock('@worker/units/deprovisioning-lifecycle');
vi.mock('@worker/units/run-deprovisioning-step');
vi.mock('workflow');

function stepsRun(): string[] {
  return vi.mocked(runDeprovisioningStep).mock.calls.map(([, , step]) => step);
}

describe(deprovisionTenant, () => {
  beforeEach(() => {
    vi.mocked(getWorkflowMetadata).mockReturnValue({
      workflowRunId: MOCK_RUN_CONTEXT.runId,
    } as ReturnType<typeof getWorkflowMetadata>);
    vi.mocked(beginDeprovisioning).mockResolvedValue(true);
    vi.mocked(runDeprovisioningStep).mockResolvedValue(okResult());
  });

  it('runs every deprovisioning step in order and finishes the run as successful', async () => {
    const outcome = await deprovisionTenant(MOCK_TENANT_ID);

    expect(outcome).toEqual({ ok: true, data: { skipped: false } });
    expect(stepsRun()).toEqual([
      DEPROVISIONING_STEP.REMOVE_DOMAIN,
      DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
      DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS,
      DEPROVISIONING_STEP.CLEAR_ARTIFACTS,
      DEPROVISIONING_STEP.ARCHIVE_TENANT,
      DEPROVISIONING_STEP.PURGE_READER_DATA,
      DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE,
    ]);
    expect(finishDeprovisioning).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_RUN_CONTEXT,
      {
        ok: true,
        data: { skipped: false },
      },
    );
  });

  it('runs nothing and succeeds for an already-deprovisioned tenant', async () => {
    vi.mocked(beginDeprovisioning).mockResolvedValue(false);

    const outcome = await deprovisionTenant(MOCK_TENANT_ID);

    expect(outcome).toEqual({ ok: true, data: { skipped: true } });
    expect(runDeprovisioningStep).not.toHaveBeenCalled();
    expect(finishDeprovisioning).not.toHaveBeenCalled();
  });

  it('stops at the first failed step and fails the run and the workflow', async () => {
    vi.mocked(runDeprovisioningStep)
      .mockResolvedValueOnce(okResult())
      .mockResolvedValueOnce(
        errorResult(DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT),
      );

    await expect(deprovisionTenant(MOCK_TENANT_ID)).rejects.toBeInstanceOf(
      FatalError,
    );

    expect(stepsRun()).toEqual([
      DEPROVISIONING_STEP.REMOVE_DOMAIN,
      DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
    ]);
    expect(finishDeprovisioning).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_RUN_CONTEXT,
      {
        ok: false,
        error: { failedStep: DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT },
      },
    );
  });

  it('finishes the run as failed when a step throws', async () => {
    vi.mocked(runDeprovisioningStep).mockRejectedValue(
      new Error(MOCK_WORKFLOW_CRASH),
    );

    await expect(deprovisionTenant(MOCK_TENANT_ID)).rejects.toBeInstanceOf(
      FatalError,
    );

    expect(finishDeprovisioning).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_RUN_CONTEXT,
      {
        ok: false,
        error: { message: MOCK_WORKFLOW_CRASH },
      },
    );
  });
});

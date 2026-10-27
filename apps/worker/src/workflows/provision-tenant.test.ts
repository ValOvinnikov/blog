import { TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils/result';
import {
  MOCK_REGISTRY_UNREACHABLE,
  MOCK_WORKFLOW_CRASH,
} from '@worker/testing/outage/fixtures';
import { MOCK_RUN_CONTEXT } from '@worker/testing/run/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { applySiteTemplate } from '@worker/units/apply-site-template';
import { ensureInfrastructure } from '@worker/units/ensure-infrastructure';
import { inviteOwner } from '@worker/units/invite-owner';
import { beginRun, finishRun } from '@worker/units/run-lifecycle';
import { startOwnerAccess } from '@worker/units/start-owner-access';
import { verifyTenant } from '@worker/units/verify-tenant';
import { FatalError, getWorkflowMetadata } from 'workflow';

import { provisionTenant } from './provision-tenant';

vi.mock('@worker/units/apply-site-template');
vi.mock('@worker/units/ensure-infrastructure');
vi.mock('@worker/units/invite-owner');
vi.mock('@worker/units/run-lifecycle');
vi.mock('@worker/units/start-owner-access');
vi.mock('@worker/units/verify-tenant');
vi.mock('workflow');

describe(provisionTenant, () => {
  beforeEach(() => {
    vi.mocked(getWorkflowMetadata).mockReturnValue({
      workflowRunId: MOCK_RUN_CONTEXT.runId,
    } as ReturnType<typeof getWorkflowMetadata>);
    vi.mocked(ensureInfrastructure).mockResolvedValue(okResult());
    vi.mocked(inviteOwner).mockResolvedValue(okResult());
    vi.mocked(applySiteTemplate).mockResolvedValue(okResult());
    vi.mocked(verifyTenant).mockResolvedValue(okResult());
  });

  it('runs the units in order between beginning and finishing the run', async () => {
    const order: string[] = [];
    vi.mocked(beginRun).mockImplementation(async () => {
      order.push('begin');
    });
    vi.mocked(ensureInfrastructure).mockImplementation(async () => {
      order.push('infrastructure');
      return okResult();
    });
    vi.mocked(inviteOwner).mockImplementation(async () => {
      order.push('invite');
      return okResult();
    });
    vi.mocked(applySiteTemplate).mockImplementation(async () => {
      order.push('template');
      return okResult();
    });
    vi.mocked(verifyTenant).mockImplementation(async () => {
      order.push('verify');
      return okResult();
    });
    vi.mocked(finishRun).mockImplementation(async () => {
      order.push('finish');
    });

    await provisionTenant(MOCK_TENANT_ID);

    expect(order).toEqual([
      'begin',
      'infrastructure',
      'invite',
      'template',
      'verify',
      'finish',
    ]);
  });

  it('finishes the run as successful when every unit succeeds', async () => {
    const outcome = await provisionTenant(MOCK_TENANT_ID);

    expect(outcome).toEqual({ ok: true, data: undefined });
    expect(finishRun).toHaveBeenCalledWith(MOCK_TENANT_ID, MOCK_RUN_CONTEXT, {
      ok: true,
      data: undefined,
    });
  });

  it('starts the owner access check once a run succeeds', async () => {
    await provisionTenant(MOCK_TENANT_ID);

    expect(startOwnerAccess).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_RUN_CONTEXT,
    );
  });

  describe('when a unit reports a failure', () => {
    beforeEach(() => {
      vi.mocked(applySiteTemplate).mockResolvedValue(
        errorResult(TENANT_PROVISIONING_STEP.SEED_CONTENT),
      );
    });

    it('stops without running the later units', async () => {
      await expect(provisionTenant(MOCK_TENANT_ID)).rejects.toThrow();

      expect(ensureInfrastructure).toHaveBeenCalled();
      expect(verifyTenant).not.toHaveBeenCalled();
    });

    it('finishes the run with the failing step', async () => {
      await expect(provisionTenant(MOCK_TENANT_ID)).rejects.toThrow();

      expect(finishRun).toHaveBeenCalledWith(MOCK_TENANT_ID, MOCK_RUN_CONTEXT, {
        ok: false,
        error: { failedStep: TENANT_PROVISIONING_STEP.SEED_CONTENT },
      });
    });

    it('ends the run in a fatal error so it is not retried', async () => {
      await expect(provisionTenant(MOCK_TENANT_ID)).rejects.toThrow(FatalError);
    });

    it('does not start the owner access check', async () => {
      await expect(provisionTenant(MOCK_TENANT_ID)).rejects.toThrow();

      expect(startOwnerAccess).not.toHaveBeenCalled();
    });
  });

  it('finishes the run with the error when a unit throws', async () => {
    vi.mocked(inviteOwner).mockRejectedValue(new Error(MOCK_WORKFLOW_CRASH));

    await expect(provisionTenant(MOCK_TENANT_ID)).rejects.toThrow(FatalError);

    expect(finishRun).toHaveBeenCalledWith(MOCK_TENANT_ID, MOCK_RUN_CONTEXT, {
      ok: false,
      error: { message: MOCK_WORKFLOW_CRASH },
    });
    expect(applySiteTemplate).not.toHaveBeenCalled();
  });

  describe('when the run cannot be started', () => {
    beforeEach(() => {
      vi.mocked(beginRun).mockRejectedValue(
        new Error(MOCK_REGISTRY_UNREACHABLE),
      );
    });

    it('finishes the run as failed with the error', async () => {
      await expect(provisionTenant(MOCK_TENANT_ID)).rejects.toThrow(FatalError);

      expect(finishRun).toHaveBeenCalledWith(MOCK_TENANT_ID, MOCK_RUN_CONTEXT, {
        ok: false,
        error: { message: MOCK_REGISTRY_UNREACHABLE },
      });
    });

    it('runs none of the units', async () => {
      await expect(provisionTenant(MOCK_TENANT_ID)).rejects.toThrow(FatalError);

      expect(ensureInfrastructure).not.toHaveBeenCalled();
    });
  });
});

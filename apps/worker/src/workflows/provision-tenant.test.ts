import { TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import { TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { applySiteTemplate } from '@worker/units/apply-site-template';
import { ensureInfrastructure } from '@worker/units/ensure-infrastructure';
import { inviteOwner } from '@worker/units/invite-owner';
import { beginRun, finishRun } from '@worker/units/run-lifecycle';
import { startOwnerAccess } from '@worker/units/start-owner-access';
import { verifyTenant } from '@worker/units/verify-tenant';
import { FatalError, getWorkflowMetadata } from 'workflow';

import { provisionTenant } from './provision-tenant';

const CTX = { runId: 'run-1' };
const NO_PROJECT = 'no project';
const REGISTRY_UNREACHABLE = 'registry unreachable';

vi.mock('@worker/units/apply-site-template');
vi.mock('@worker/units/ensure-infrastructure');
vi.mock('@worker/units/invite-owner');
vi.mock('@worker/units/run-lifecycle');
vi.mock('@worker/units/start-owner-access');
vi.mock('@worker/units/verify-tenant');
vi.mock('workflow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('workflow')>()),
  getWorkflowMetadata: vi.fn(),
}));

describe(provisionTenant, () => {
  beforeEach(() => {
    vi.mocked(getWorkflowMetadata).mockReturnValue({
      workflowRunId: CTX.runId,
    } as ReturnType<typeof getWorkflowMetadata>);
    vi.mocked(ensureInfrastructure).mockResolvedValue({ ok: true });
    vi.mocked(inviteOwner).mockResolvedValue({ ok: true });
    vi.mocked(applySiteTemplate).mockResolvedValue({ ok: true });
    vi.mocked(verifyTenant).mockResolvedValue({ ok: true });
  });

  it('runs the units in order between beginning and finishing the run', async () => {
    const order: string[] = [];
    vi.mocked(beginRun).mockImplementation(async () => {
      order.push('begin');
    });
    vi.mocked(ensureInfrastructure).mockImplementation(async () => {
      order.push('infrastructure');
      return { ok: true };
    });
    vi.mocked(inviteOwner).mockImplementation(async () => {
      order.push('invite');
      return { ok: true };
    });
    vi.mocked(applySiteTemplate).mockImplementation(async () => {
      order.push('template');
      return { ok: true };
    });
    vi.mocked(verifyTenant).mockImplementation(async () => {
      order.push('verify');
      return { ok: true };
    });
    vi.mocked(finishRun).mockImplementation(async () => {
      order.push('finish');
    });

    await provisionTenant(TEST_TENANT_ID);

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
    const outcome = await provisionTenant(TEST_TENANT_ID);

    expect(outcome).toEqual({ ok: true });
    expect(finishRun).toHaveBeenCalledWith(TEST_TENANT_ID, CTX, { ok: true });
  });

  it('starts the owner access check once a run succeeds', async () => {
    await provisionTenant(TEST_TENANT_ID);

    expect(startOwnerAccess).toHaveBeenCalledWith(TEST_TENANT_ID, CTX);
  });

  describe('when a unit reports a failure', () => {
    const failure = {
      ok: false,
      failedStep: TENANT_PROVISIONING_STEP.SEED_CONTENT,
    } as const;

    beforeEach(() => {
      vi.mocked(applySiteTemplate).mockResolvedValue(failure);
    });

    it('stops without running the later units', async () => {
      await expect(provisionTenant(TEST_TENANT_ID)).rejects.toThrow();

      expect(ensureInfrastructure).toHaveBeenCalled();
      expect(verifyTenant).not.toHaveBeenCalled();
    });

    it('finishes the run with the failing step', async () => {
      await expect(provisionTenant(TEST_TENANT_ID)).rejects.toThrow();

      expect(finishRun).toHaveBeenCalledWith(TEST_TENANT_ID, CTX, failure);
    });

    it('ends the run in a fatal error so it is not retried', async () => {
      await expect(provisionTenant(TEST_TENANT_ID)).rejects.toThrow(FatalError);
    });

    it('does not start the owner access check', async () => {
      await expect(provisionTenant(TEST_TENANT_ID)).rejects.toThrow();

      expect(startOwnerAccess).not.toHaveBeenCalled();
    });
  });

  it('finishes the run with the error when a unit throws', async () => {
    vi.mocked(inviteOwner).mockRejectedValue(new Error(NO_PROJECT));

    await expect(provisionTenant(TEST_TENANT_ID)).rejects.toThrow(FatalError);

    expect(finishRun).toHaveBeenCalledWith(TEST_TENANT_ID, CTX, {
      ok: false,
      error: NO_PROJECT,
    });
    expect(applySiteTemplate).not.toHaveBeenCalled();
  });

  describe('when the run cannot be started', () => {
    beforeEach(() => {
      vi.mocked(beginRun).mockRejectedValue(new Error(REGISTRY_UNREACHABLE));
    });

    it('finishes the run as failed with the error', async () => {
      await expect(provisionTenant(TEST_TENANT_ID)).rejects.toThrow(FatalError);

      expect(finishRun).toHaveBeenCalledWith(TEST_TENANT_ID, CTX, {
        ok: false,
        error: REGISTRY_UNREACHABLE,
      });
    });

    it('runs none of the units', async () => {
      await expect(provisionTenant(TEST_TENANT_ID)).rejects.toThrow(FatalError);

      expect(ensureInfrastructure).not.toHaveBeenCalled();
    });
  });
});

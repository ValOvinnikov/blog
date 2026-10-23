import {
  CORE_DEPROVISIONING_STEPS,
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TDeprovisioningStep,
} from '@blog/db/constants';
import { MOCK_DEPROVISION_ENV } from '@blog/db/testing/deprovision-tenant/fixtures';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import type { Mock } from 'vitest';

import { runDeprovisioning, runSteps } from './run';

const { removeTenantDomainMock } = vi.hoisted(() => ({
  removeTenantDomainMock: vi.fn(),
}));
const { archiveTenantSanityProjectMock } = vi.hoisted(() => ({
  archiveTenantSanityProjectMock: vi.fn(),
}));
const { revokeTenantSanityTokensMock } = vi.hoisted(() => ({
  revokeTenantSanityTokensMock: vi.fn(),
}));
const { clearTenantArtifactsMock } = vi.hoisted(() => ({
  clearTenantArtifactsMock: vi.fn(),
}));
const { archiveTenantRowMock } = vi.hoisted(() => ({
  archiveTenantRowMock: vi.fn(),
}));
const { purgeTenantReaderDataMock } = vi.hoisted(() => ({
  purgeTenantReaderDataMock: vi.fn(),
}));
const { invalidateTenantCacheMock } = vi.hoisted(() => ({
  invalidateTenantCacheMock: vi.fn(),
}));
const { reportDeprovisioningStepStatusMock } = vi.hoisted(() => ({
  reportDeprovisioningStepStatusMock: vi.fn(),
}));
const { reportDeprovisioningRunStartMock, reportDeprovisioningRunFinishMock } =
  vi.hoisted(() => ({
    reportDeprovisioningRunStartMock: vi.fn(),
    reportDeprovisioningRunFinishMock: vi.fn(),
  }));

vi.mock('./steps/remove-domain', () => ({
  removeTenantDomain: removeTenantDomainMock,
}));
vi.mock('./steps/archive-sanity-project', () => ({
  archiveTenantSanityProject: archiveTenantSanityProjectMock,
}));
vi.mock('./steps/revoke-sanity-tokens', () => ({
  revokeTenantSanityTokens: revokeTenantSanityTokensMock,
}));
vi.mock('./steps/clear-artifacts', () => ({
  clearTenantArtifacts: clearTenantArtifactsMock,
}));
vi.mock('./steps/archive-tenant', () => ({
  archiveTenantRow: archiveTenantRowMock,
}));
vi.mock('./steps/purge-reader-data', () => ({
  purgeTenantReaderData: purgeTenantReaderDataMock,
}));
vi.mock('./steps/invalidate-tenant-cache', () => ({
  invalidateTenantCache: invalidateTenantCacheMock,
}));
vi.mock('./lib/report-deprovisioning-step-status', () => ({
  reportDeprovisioningStepStatus: reportDeprovisioningStepStatusMock,
}));
vi.mock('./lib/report-deprovisioning-run', () => ({
  reportDeprovisioningRunStart: reportDeprovisioningRunStartMock,
  reportDeprovisioningRunFinish: reportDeprovisioningRunFinishMock,
}));

const MOCK_TENANT = mockTenant();
const MOCK_WRONG_CONFIRM = 'Wrong Name';
const MOCK_STEP_ERROR = 'boom';
const MOCK_REPORT_ERROR = 'db unreachable';

const STEP_MOCKS: [TDeprovisioningStep, Mock][] = [
  [DEPROVISIONING_STEP.REMOVE_DOMAIN, removeTenantDomainMock],
  [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT, archiveTenantSanityProjectMock],
  [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS, revokeTenantSanityTokensMock],
  [DEPROVISIONING_STEP.CLEAR_ARTIFACTS, clearTenantArtifactsMock],
  [DEPROVISIONING_STEP.ARCHIVE_TENANT, archiveTenantRowMock],
  [DEPROVISIONING_STEP.PURGE_READER_DATA, purgeTenantReaderDataMock],
  [DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE, invalidateTenantCacheMock],
];

beforeEach(() => {
  removeTenantDomainMock.mockReset().mockResolvedValue(undefined);
  archiveTenantSanityProjectMock.mockReset().mockResolvedValue(undefined);
  revokeTenantSanityTokensMock.mockReset().mockResolvedValue(undefined);
  clearTenantArtifactsMock.mockReset().mockResolvedValue(undefined);
  archiveTenantRowMock.mockReset().mockResolvedValue(undefined);
  purgeTenantReaderDataMock.mockReset().mockResolvedValue(undefined);
  invalidateTenantCacheMock.mockReset().mockResolvedValue(undefined);
  reportDeprovisioningStepStatusMock.mockReset().mockResolvedValue(undefined);
  reportDeprovisioningRunStartMock.mockReset().mockResolvedValue(undefined);
  reportDeprovisioningRunFinishMock.mockReset().mockResolvedValue(undefined);
});

describe(runSteps, () => {
  it('runs every step in order, revoking tokens before clearing artifacts and archiving before purging and invalidating', async () => {
    const callOrder: TDeprovisioningStep[] = [];
    for (const [step, mock] of STEP_MOCKS) {
      mock.mockImplementation(async () => {
        callOrder.push(step);
      });
    }

    await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(callOrder).toEqual(STEP_MOCKS.map(([step]) => step));
  });

  it('reports RUNNING for each step in exactly CORE_DEPROVISIONING_STEPS order', async () => {
    await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    const reportedOrder = reportDeprovisioningStepStatusMock.mock.calls
      .map(([call]) => call as { step: string; status: string })
      .filter((call) => call.status === TENANT_PROVISIONING_STEP_STATUS.RUNNING)
      .map((call) => call.step);

    expect(reportedOrder).toEqual(CORE_DEPROVISIONING_STEPS);
  });

  it('reports failure but leaves the already-committed archive and purge untouched when invalidate-tenant-cache fails', async () => {
    invalidateTenantCacheMock.mockRejectedValue(new Error('missing config'));

    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(result).toEqual({ ok: false });
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
    expect(purgeTenantReaderDataMock).toHaveBeenCalledTimes(1);
    expect(invalidateTenantCacheMock).toHaveBeenCalledTimes(1);
  });

  it('passes the same tenant row and env through to every step', async () => {
    await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    for (const [, mock] of STEP_MOCKS) {
      expect(mock).toHaveBeenCalledWith(MOCK_TENANT, MOCK_DEPROVISION_ENV);
    }
  });

  it('records the run start, RUNNING then DONE for every step, and the run finish on a clean run', async () => {
    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(result).toEqual({ ok: true });
    expect(reportDeprovisioningRunStartMock).toHaveBeenCalledTimes(1);
    expect(reportDeprovisioningRunStartMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT.id,
      workflowRunUrl: `${MOCK_DEPROVISION_ENV.githubServerUrl}/${MOCK_DEPROVISION_ENV.githubRepository}/actions/runs/${MOCK_DEPROVISION_ENV.githubRunId}`,
    });
    for (const step of CORE_DEPROVISIONING_STEPS) {
      expect(reportDeprovisioningStepStatusMock).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT.id,
        step,
        status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      });
      expect(reportDeprovisioningStepStatusMock).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT.id,
        step,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      });
    }
    expect(reportDeprovisioningRunFinishMock).toHaveBeenCalledTimes(1);
    expect(reportDeprovisioningRunFinishMock).toHaveBeenCalledWith(
      MOCK_TENANT.id,
    );
  });

  it('writes nothing to deprovisioning step state during a dry run', async () => {
    const result = await runSteps(MOCK_TENANT, {
      ...MOCK_DEPROVISION_ENV,
      dryRun: true,
    });

    expect(result).toEqual({ ok: true });
    expect(reportDeprovisioningRunStartMock).not.toHaveBeenCalled();
    expect(reportDeprovisioningStepStatusMock).not.toHaveBeenCalled();
    expect(reportDeprovisioningRunFinishMock).not.toHaveBeenCalled();
  });

  it('continues the teardown when a step-status write itself throws', async () => {
    reportDeprovisioningStepStatusMock.mockRejectedValueOnce(
      new Error(MOCK_REPORT_ERROR),
    );

    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(result).toEqual({ ok: true });
    expect(removeTenantDomainMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantSanityProjectMock).toHaveBeenCalledTimes(1);
    expect(invalidateTenantCacheMock).toHaveBeenCalledTimes(1);
  });

  it('still runs archive-tenant when recording the run start itself throws', async () => {
    reportDeprovisioningRunStartMock.mockRejectedValueOnce(
      new Error(MOCK_REPORT_ERROR),
    );

    const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

    expect(result).toEqual({ ok: true });
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
  });

  describe('when archive-sanity-project throws', () => {
    beforeEach(() => {
      archiveTenantSanityProjectMock.mockRejectedValue(
        new Error(MOCK_STEP_ERROR),
      );
    });

    it('stops at the first failing step and never runs later steps', async () => {
      const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

      expect(result).toEqual({ ok: false });
      expect(removeTenantDomainMock).toHaveBeenCalledTimes(1);
      expect(archiveTenantSanityProjectMock).toHaveBeenCalledTimes(1);
      expect(revokeTenantSanityTokensMock).not.toHaveBeenCalled();
      expect(clearTenantArtifactsMock).not.toHaveBeenCalled();
      expect(archiveTenantRowMock).not.toHaveBeenCalled();
      expect(purgeTenantReaderDataMock).not.toHaveBeenCalled();
      expect(invalidateTenantCacheMock).not.toHaveBeenCalled();
    });

    it('records FAILED with the error and the run finish when a step throws, and never reports later steps', async () => {
      const result = await runSteps(MOCK_TENANT, MOCK_DEPROVISION_ENV);

      expect(result).toEqual({ ok: false });
      expect(reportDeprovisioningStepStatusMock.mock.calls).toEqual([
        [
          {
            tenantId: MOCK_TENANT.id,
            step: DEPROVISIONING_STEP.REMOVE_DOMAIN,
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        ],
        [
          {
            tenantId: MOCK_TENANT.id,
            step: DEPROVISIONING_STEP.REMOVE_DOMAIN,
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
        ],
        [
          {
            tenantId: MOCK_TENANT.id,
            step: DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        ],
        [
          {
            tenantId: MOCK_TENANT.id,
            step: DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT,
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: MOCK_STEP_ERROR,
          },
        ],
      ]);
      expect(reportDeprovisioningRunFinishMock).toHaveBeenCalledTimes(1);
    });

    it('never reports a step during a dry run even when the step itself throws', async () => {
      const result = await runSteps(MOCK_TENANT, {
        ...MOCK_DEPROVISION_ENV,
        dryRun: true,
      });

      expect(result).toEqual({ ok: false });
      expect(reportDeprovisioningStepStatusMock).not.toHaveBeenCalled();
      expect(reportDeprovisioningRunFinishMock).not.toHaveBeenCalled();
    });
  });
});

describe(runDeprovisioning, () => {
  it('throws before any step runs when confirm does not match the name', async () => {
    await expect(
      runDeprovisioning(MOCK_TENANT, MOCK_WRONG_CONFIRM, MOCK_DEPROVISION_ENV),
    ).rejects.toThrow(
      `deprovision-tenant: --confirm="${MOCK_WRONG_CONFIRM}" does not match tenant name "${MOCK_TENANT.name}" — aborting before any destructive action.`,
    );

    expect(removeTenantDomainMock).not.toHaveBeenCalled();
    expect(archiveTenantSanityProjectMock).not.toHaveBeenCalled();
    expect(revokeTenantSanityTokensMock).not.toHaveBeenCalled();
    expect(clearTenantArtifactsMock).not.toHaveBeenCalled();
    expect(archiveTenantRowMock).not.toHaveBeenCalled();
    expect(purgeTenantReaderDataMock).not.toHaveBeenCalled();
    expect(invalidateTenantCacheMock).not.toHaveBeenCalled();
  });

  it('runs every step when confirm matches the name', async () => {
    const result = await runDeprovisioning(
      MOCK_TENANT,
      MOCK_TENANT.name,
      MOCK_DEPROVISION_ENV,
    );

    expect(result).toEqual({ ok: true });
    expect(removeTenantDomainMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
    expect(purgeTenantReaderDataMock).toHaveBeenCalledTimes(1);
    expect(invalidateTenantCacheMock).toHaveBeenCalledTimes(1);
  });

  it('skips every step without checking confirm when already deprovisioned', async () => {
    const result = await runDeprovisioning(
      { ...MOCK_TENANT, deprovisionedAt: new Date() },
      MOCK_WRONG_CONFIRM,
      MOCK_DEPROVISION_ENV,
    );

    expect(result).toEqual({ ok: true, skipped: true });
    expect(removeTenantDomainMock).not.toHaveBeenCalled();
    expect(archiveTenantRowMock).not.toHaveBeenCalled();
    expect(purgeTenantReaderDataMock).not.toHaveBeenCalled();
    expect(invalidateTenantCacheMock).not.toHaveBeenCalled();
  });
});

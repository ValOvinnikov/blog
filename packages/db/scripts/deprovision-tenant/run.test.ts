import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from './lib/env';
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

const baseTenant = { id: 'tenant-1', name: 'Acme' } as TTenant;
const env: TDeprovisionEnv = {
  sanityManagementToken: 'sanity-token',
  vercelToken: 'vercel-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'proj-1',
  dryRun: false,
  githubActor: 'octocat',
  githubRunId: 'run-42',
  githubRepository: 'acme/blog',
  githubServerUrl: 'https://github.com',
  webAppUrl: 'https://web.example.com',
  siteConfigRevalidateSecret: 'shared-secret',
};

beforeEach(() => {
  removeTenantDomainMock.mockReset().mockResolvedValue(undefined);
  archiveTenantSanityProjectMock.mockReset().mockResolvedValue(undefined);
  revokeTenantSanityTokensMock.mockReset().mockResolvedValue(undefined);
  clearTenantArtifactsMock.mockReset().mockResolvedValue(undefined);
  archiveTenantRowMock.mockReset().mockResolvedValue(undefined);
  invalidateTenantCacheMock.mockReset().mockResolvedValue(undefined);
  reportDeprovisioningStepStatusMock.mockReset().mockResolvedValue(undefined);
  reportDeprovisioningRunStartMock.mockReset().mockResolvedValue(undefined);
  reportDeprovisioningRunFinishMock.mockReset().mockResolvedValue(undefined);
});

describe(runSteps, () => {
  it('runs every step, in order, on a clean run', async () => {
    const result = await runSteps(baseTenant, env);

    expect(result).toEqual({ ok: true });
    expect(removeTenantDomainMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantSanityProjectMock).toHaveBeenCalledTimes(1);
    expect(revokeTenantSanityTokensMock).toHaveBeenCalledTimes(1);
    expect(clearTenantArtifactsMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
    expect(invalidateTenantCacheMock).toHaveBeenCalledTimes(1);
  });

  it('runs revoke-sanity-tokens before clear-artifacts', async () => {
    const callOrder: string[] = [];
    revokeTenantSanityTokensMock.mockImplementation(async () => {
      callOrder.push('revoke-sanity-tokens');
    });
    clearTenantArtifactsMock.mockImplementation(async () => {
      callOrder.push('clear-artifacts');
    });

    await runSteps(baseTenant, env);

    expect(callOrder).toEqual(['revoke-sanity-tokens', 'clear-artifacts']);
  });

  it('runs archive-tenant before invalidate-tenant-cache', async () => {
    const callOrder: string[] = [];
    archiveTenantRowMock.mockImplementation(async () => {
      callOrder.push('archive-tenant');
    });
    invalidateTenantCacheMock.mockImplementation(async () => {
      callOrder.push('invalidate-tenant-cache');
    });

    await runSteps(baseTenant, env);

    expect(callOrder).toEqual(['archive-tenant', 'invalidate-tenant-cache']);
  });

  it('stops at the first failing step and never runs later steps', async () => {
    archiveTenantSanityProjectMock.mockRejectedValue(new Error('boom'));

    const result = await runSteps(baseTenant, env);

    expect(result).toEqual({ ok: false });
    expect(removeTenantDomainMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantSanityProjectMock).toHaveBeenCalledTimes(1);
    expect(revokeTenantSanityTokensMock).not.toHaveBeenCalled();
    expect(clearTenantArtifactsMock).not.toHaveBeenCalled();
    expect(archiveTenantRowMock).not.toHaveBeenCalled();
    expect(invalidateTenantCacheMock).not.toHaveBeenCalled();
  });

  it('reports failure but leaves the already-committed archive untouched when invalidate-tenant-cache fails', async () => {
    invalidateTenantCacheMock.mockRejectedValue(new Error('missing config'));

    const result = await runSteps(baseTenant, env);

    expect(result).toEqual({ ok: false });
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
    expect(invalidateTenantCacheMock).toHaveBeenCalledTimes(1);
  });

  it('passes the same tenant row and env through to every step', async () => {
    await runSteps(baseTenant, env);

    for (const mock of [
      removeTenantDomainMock,
      archiveTenantSanityProjectMock,
      revokeTenantSanityTokensMock,
      clearTenantArtifactsMock,
      archiveTenantRowMock,
      invalidateTenantCacheMock,
    ]) {
      expect(mock).toHaveBeenCalledWith(baseTenant, env);
    }
  });

  it('records the run start, RUNNING then DONE for every step, and the run finish on a clean run', async () => {
    const result = await runSteps(baseTenant, env);

    expect(result).toEqual({ ok: true });
    expect(reportDeprovisioningRunStartMock).toHaveBeenCalledTimes(1);
    expect(reportDeprovisioningRunStartMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/run-42',
    });
    for (const step of [
      'REMOVE_DOMAIN',
      'ARCHIVE_SANITY_PROJECT',
      'REVOKE_SANITY_TOKENS',
      'CLEAR_ARTIFACTS',
      'ARCHIVE_TENANT',
      'INVALIDATE_TENANT_CACHE',
    ]) {
      expect(reportDeprovisioningStepStatusMock).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        step,
        status: 'RUNNING',
      });
      expect(reportDeprovisioningStepStatusMock).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        step,
        status: 'DONE',
      });
    }
    expect(reportDeprovisioningRunFinishMock).toHaveBeenCalledTimes(1);
    expect(reportDeprovisioningRunFinishMock).toHaveBeenCalledWith('tenant-1');
  });

  it('records FAILED with the error and the run finish when a step throws, and never reports later steps', async () => {
    archiveTenantSanityProjectMock.mockRejectedValue(new Error('boom'));

    const result = await runSteps(baseTenant, env);

    expect(result).toEqual({ ok: false });
    expect(reportDeprovisioningStepStatusMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      step: 'ARCHIVE_SANITY_PROJECT',
      status: 'FAILED',
      error: 'boom',
    });
    expect(reportDeprovisioningStepStatusMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ step: 'REVOKE_SANITY_TOKENS' }),
    );
    expect(reportDeprovisioningRunFinishMock).toHaveBeenCalledTimes(1);
  });

  it('writes nothing to deprovisioning step state during a dry run', async () => {
    const result = await runSteps(baseTenant, { ...env, dryRun: true });

    expect(result).toEqual({ ok: true });
    expect(reportDeprovisioningRunStartMock).not.toHaveBeenCalled();
    expect(reportDeprovisioningStepStatusMock).not.toHaveBeenCalled();
    expect(reportDeprovisioningRunFinishMock).not.toHaveBeenCalled();
  });

  it('never reports a step during a dry run even when the step itself throws', async () => {
    archiveTenantSanityProjectMock.mockRejectedValue(new Error('boom'));

    const result = await runSteps(baseTenant, { ...env, dryRun: true });

    expect(result).toEqual({ ok: false });
    expect(reportDeprovisioningStepStatusMock).not.toHaveBeenCalled();
    expect(reportDeprovisioningRunFinishMock).not.toHaveBeenCalled();
  });

  it('continues the teardown when a step-status write itself throws', async () => {
    reportDeprovisioningStepStatusMock.mockRejectedValueOnce(
      new Error('db unreachable'),
    );

    const result = await runSteps(baseTenant, env);

    expect(result).toEqual({ ok: true });
    expect(removeTenantDomainMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantSanityProjectMock).toHaveBeenCalledTimes(1);
    expect(invalidateTenantCacheMock).toHaveBeenCalledTimes(1);
  });

  it('still runs archive-tenant when recording the run start itself throws', async () => {
    reportDeprovisioningRunStartMock.mockRejectedValueOnce(
      new Error('db unreachable'),
    );

    const result = await runSteps(baseTenant, env);

    expect(result).toEqual({ ok: true });
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
  });
});

describe(runDeprovisioning, () => {
  it('throws before any step runs when confirm does not match the name', async () => {
    await expect(
      runDeprovisioning(baseTenant, 'Wrong Name', env),
    ).rejects.toThrow(
      'deprovision-tenant: --confirm="Wrong Name" does not match tenant name "Acme" — aborting before any destructive action.',
    );

    expect(removeTenantDomainMock).not.toHaveBeenCalled();
    expect(archiveTenantSanityProjectMock).not.toHaveBeenCalled();
    expect(revokeTenantSanityTokensMock).not.toHaveBeenCalled();
    expect(clearTenantArtifactsMock).not.toHaveBeenCalled();
    expect(archiveTenantRowMock).not.toHaveBeenCalled();
    expect(invalidateTenantCacheMock).not.toHaveBeenCalled();
  });

  it('runs every step when confirm matches the name', async () => {
    const result = await runDeprovisioning(baseTenant, 'Acme', env);

    expect(result).toEqual({ ok: true });
    expect(removeTenantDomainMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
    expect(invalidateTenantCacheMock).toHaveBeenCalledTimes(1);
  });

  it('skips every step without checking confirm when already deprovisioned', async () => {
    const tenant = { ...baseTenant, deprovisionedAt: new Date() } as TTenant;

    const result = await runDeprovisioning(tenant, 'Wrong Name', env);

    expect(result).toEqual({ ok: true, skipped: true });
    expect(removeTenantDomainMock).not.toHaveBeenCalled();
    expect(archiveTenantRowMock).not.toHaveBeenCalled();
    expect(invalidateTenantCacheMock).not.toHaveBeenCalled();
  });
});

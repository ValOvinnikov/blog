import type { TTenant } from '@blog/db/schema/tenants';

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

const baseTenant = { id: 'tenant-1', slug: 'acme' } as TTenant;
const env = {
  sanityManagementToken: 'sanity-token',
  vercelToken: 'vercel-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'proj-1',
  dryRun: false,
  githubActor: 'octocat',
  githubRunId: 'run-42',
};

beforeEach(() => {
  removeTenantDomainMock.mockReset().mockResolvedValue(undefined);
  archiveTenantSanityProjectMock.mockReset().mockResolvedValue(undefined);
  revokeTenantSanityTokensMock.mockReset().mockResolvedValue(undefined);
  clearTenantArtifactsMock.mockReset().mockResolvedValue(undefined);
  archiveTenantRowMock.mockReset().mockResolvedValue(undefined);
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

  it('stops at the first failing step and never runs later steps', async () => {
    archiveTenantSanityProjectMock.mockRejectedValue(new Error('boom'));

    const result = await runSteps(baseTenant, env);

    expect(result).toEqual({ ok: false });
    expect(removeTenantDomainMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantSanityProjectMock).toHaveBeenCalledTimes(1);
    expect(revokeTenantSanityTokensMock).not.toHaveBeenCalled();
    expect(clearTenantArtifactsMock).not.toHaveBeenCalled();
    expect(archiveTenantRowMock).not.toHaveBeenCalled();
  });

  it('passes the same tenant row and env through to every step', async () => {
    await runSteps(baseTenant, env);

    for (const mock of [
      removeTenantDomainMock,
      archiveTenantSanityProjectMock,
      revokeTenantSanityTokensMock,
      clearTenantArtifactsMock,
      archiveTenantRowMock,
    ]) {
      expect(mock).toHaveBeenCalledWith(baseTenant, env);
    }
  });
});

describe(runDeprovisioning, () => {
  it('throws before any step runs when confirm does not match the slug', async () => {
    await expect(
      runDeprovisioning(baseTenant, 'wrong-slug', env),
    ).rejects.toThrow(
      'deprovision-tenant: --confirm="wrong-slug" does not match tenant slug "acme" — aborting before any destructive action.',
    );

    expect(removeTenantDomainMock).not.toHaveBeenCalled();
    expect(archiveTenantSanityProjectMock).not.toHaveBeenCalled();
    expect(revokeTenantSanityTokensMock).not.toHaveBeenCalled();
    expect(clearTenantArtifactsMock).not.toHaveBeenCalled();
    expect(archiveTenantRowMock).not.toHaveBeenCalled();
  });

  it('runs every step when confirm matches the slug', async () => {
    const result = await runDeprovisioning(baseTenant, 'acme', env);

    expect(result).toEqual({ ok: true });
    expect(removeTenantDomainMock).toHaveBeenCalledTimes(1);
    expect(archiveTenantRowMock).toHaveBeenCalledTimes(1);
  });

  it('skips every step without checking confirm when already deprovisioned', async () => {
    const tenant = { ...baseTenant, deprovisionedAt: new Date() } as TTenant;

    const result = await runDeprovisioning(tenant, 'wrong-slug', env);

    expect(result).toEqual({ ok: true, skipped: true });
    expect(removeTenantDomainMock).not.toHaveBeenCalled();
    expect(archiveTenantRowMock).not.toHaveBeenCalled();
  });
});

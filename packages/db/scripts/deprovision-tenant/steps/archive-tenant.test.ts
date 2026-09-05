import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

import { archiveTenantRow } from './archive-tenant';

const { archiveTenantMock, insertAuditEventMock } = vi.hoisted(() => ({
  archiveTenantMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  archiveTenant: archiveTenantMock,
}));

vi.mock('@blog/db/queries/audit-events', () => ({
  insertAuditEvent: insertAuditEventMock,
}));

const env: TDeprovisionEnv = {
  sanityManagementToken: 'mgmt-token',
  vercelToken: 'v-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'prj_web',
  dryRun: false,
  githubActor: 'octocat',
  githubRunId: 'run-42',
  githubRepository: 'acme/blog',
  githubServerUrl: 'https://github.com',
  webAppUrl: 'https://web.example.com',
  siteConfigRevalidateSecret: 'shared-secret',
};

function baseTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: 'tenant-1',
    name: 'Acme',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    locale: 'en',
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: null,
    provisioningSteps: null,
    studioVercelProjectId: null,
    seededAt: null,
    deprovisionedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  archiveTenantMock
    .mockReset()
    .mockResolvedValue({ ok: true, data: baseTenant() });
  insertAuditEventMock.mockReset().mockResolvedValue({});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(archiveTenantRow, () => {
  it('archives the tenant row', async () => {
    await archiveTenantRow(baseTenant(), env);

    expect(archiveTenantMock).toHaveBeenCalledWith('tenant-1');
  });

  it('records exactly one DEPROVISIONED/TENANT audit event after a successful archive', async () => {
    await archiveTenantRow(baseTenant(), env);

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'github:octocat',
      actorEmail: 'octocat@users.noreply.github.com',
      action: 'DEPROVISIONED',
      targetType: 'TENANT',
      targetId: 'tenant-1',
      details: { via: 'deprovision-tenant-workflow', runId: 'run-42' },
    });
  });

  it('skips when already deprovisioned', async () => {
    await archiveTenantRow(baseTenant({ deprovisionedAt: new Date() }), env);

    expect(archiveTenantMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('does not write to the row or record an audit event in dry-run mode', async () => {
    await archiveTenantRow(baseTenant(), { ...env, dryRun: true });

    expect(archiveTenantMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('archives successfully and logs, without throwing, when the audit write fails', async () => {
    insertAuditEventMock.mockRejectedValueOnce(new Error('insert failed'));

    await expect(archiveTenantRow(baseTenant(), env)).resolves.toBeUndefined();

    expect(archiveTenantMock).toHaveBeenCalledWith('tenant-1');
    expect(console.error).toHaveBeenCalled();
  });

  it('archives successfully and skips the audit write when GITHUB_ACTOR is unset', async () => {
    await expect(
      archiveTenantRow(baseTenant(), { ...env, githubActor: undefined }),
    ).resolves.toBeUndefined();

    expect(archiveTenantMock).toHaveBeenCalledWith('tenant-1');
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});

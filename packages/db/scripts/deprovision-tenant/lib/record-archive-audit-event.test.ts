import type { TDeprovisionEnv } from './env';
import { recordArchiveAuditEvent } from './record-archive-audit-event';

const { insertAuditEventMock } = vi.hoisted(() => ({
  insertAuditEventMock: vi.fn(),
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
  webAppUrl: 'https://web.example.com',
  siteConfigRevalidateSecret: 'shared-secret',
};

beforeEach(() => {
  insertAuditEventMock.mockReset().mockResolvedValue({});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(recordArchiveAuditEvent, () => {
  it('inserts an ARCHIVED/TENANT audit event attributed to the GitHub actor', async () => {
    await recordArchiveAuditEvent('tenant-1', env);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'github:octocat',
      actorEmail: 'octocat@users.noreply.github.com',
      action: 'ARCHIVED',
      targetType: 'TENANT',
      targetId: 'tenant-1',
      details: { via: 'deprovision-tenant-workflow', runId: 'run-42' },
    });
  });

  it('logs and does not throw when the insert rejects', async () => {
    insertAuditEventMock.mockRejectedValueOnce(new Error('db down'));

    await expect(
      recordArchiveAuditEvent('tenant-1', env),
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalled();
  });

  it('logs and skips the insert when GITHUB_ACTOR is unset', async () => {
    await recordArchiveAuditEvent('tenant-1', {
      ...env,
      githubActor: undefined,
    });

    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});

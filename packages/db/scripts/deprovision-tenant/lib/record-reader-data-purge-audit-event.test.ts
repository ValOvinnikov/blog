import type { TDeprovisionEnv } from './env';
import { recordReaderDataPurgeAuditEvent } from './record-reader-data-purge-audit-event';

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
  githubRepository: 'acme/blog',
  githubServerUrl: 'https://github.com',
  webAppUrl: 'https://web.example.com',
  siteConfigRevalidateSecret: 'shared-secret',
};

const counts = { subscribers: 3, bookmarks: 5, membershipInvites: 1 };

beforeEach(() => {
  insertAuditEventMock.mockReset().mockResolvedValue({});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(recordReaderDataPurgeAuditEvent, () => {
  it('inserts a READER_DATA_PURGED/TENANT audit event with the per-table counts, attributed to the GitHub actor', async () => {
    await recordReaderDataPurgeAuditEvent('tenant-1', env, counts);

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'github:octocat',
      actorEmail: 'octocat@users.noreply.github.com',
      action: 'READER_DATA_PURGED',
      targetType: 'TENANT',
      targetId: 'tenant-1',
      details: {
        via: 'deprovision-tenant-workflow',
        runId: 'run-42',
        subscribers: 3,
        bookmarks: 5,
        membershipInvites: 1,
      },
    });
  });

  it('logs and does not throw when the insert rejects', async () => {
    insertAuditEventMock.mockRejectedValueOnce(new Error('db down'));

    await expect(
      recordReaderDataPurgeAuditEvent('tenant-1', env, counts),
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalled();
  });

  it('logs and skips the insert when GITHUB_ACTOR is unset', async () => {
    await recordReaderDataPurgeAuditEvent(
      'tenant-1',
      { ...env, githubActor: undefined },
      counts,
    );

    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});

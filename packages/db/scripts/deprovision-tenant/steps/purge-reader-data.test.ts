import { LOCALE_ISO_CODES } from '@blog/config/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

import { purgeTenantReaderData } from './purge-reader-data';

const {
  countSubscribersForTenantMock,
  deleteSubscribersForTenantMock,
  countBookmarksForTenantMock,
  deleteBookmarksForTenantMock,
  countMembershipInvitesForTenantMock,
  deleteMembershipInvitesForTenantMock,
  insertAuditEventMock,
} = vi.hoisted(() => ({
  countSubscribersForTenantMock: vi.fn(),
  deleteSubscribersForTenantMock: vi.fn(),
  countBookmarksForTenantMock: vi.fn(),
  deleteBookmarksForTenantMock: vi.fn(),
  countMembershipInvitesForTenantMock: vi.fn(),
  deleteMembershipInvitesForTenantMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@blog/db/queries/subscribers', () => ({
  countSubscribersForTenant: countSubscribersForTenantMock,
  deleteSubscribersForTenant: deleteSubscribersForTenantMock,
}));

vi.mock('@blog/db/queries/bookmarks', () => ({
  countBookmarksForTenant: countBookmarksForTenantMock,
  deleteBookmarksForTenant: deleteBookmarksForTenantMock,
}));

vi.mock('@blog/db/queries/membership-invites', () => ({
  countMembershipInvitesForTenant: countMembershipInvitesForTenantMock,
  deleteMembershipInvitesForTenant: deleteMembershipInvitesForTenantMock,
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
    locale: LOCALE_ISO_CODES.EN,
    plan: 'FREE',
    status: 'ACTIVE',
    provisioningStatus: null,
    provisioningSteps: null,
    seededAt: null,
    deprovisionedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TTenant;
}

beforeEach(() => {
  countSubscribersForTenantMock.mockReset().mockResolvedValue(3);
  deleteSubscribersForTenantMock.mockReset().mockResolvedValue(3);
  countBookmarksForTenantMock.mockReset().mockResolvedValue(5);
  deleteBookmarksForTenantMock.mockReset().mockResolvedValue(5);
  countMembershipInvitesForTenantMock.mockReset().mockResolvedValue(1);
  deleteMembershipInvitesForTenantMock.mockReset().mockResolvedValue(1);
  insertAuditEventMock.mockReset().mockResolvedValue({});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(purgeTenantReaderData, () => {
  it('deletes every reader-data row for the tenant across all three tables', async () => {
    await purgeTenantReaderData(baseTenant(), env);

    expect(deleteSubscribersForTenantMock).toHaveBeenCalledWith('tenant-1');
    expect(deleteBookmarksForTenantMock).toHaveBeenCalledWith('tenant-1');
    expect(deleteMembershipInvitesForTenantMock).toHaveBeenCalledWith(
      'tenant-1',
    );
  });

  it('records exactly one READER_DATA_PURGED/TENANT audit event with the per-table counts', async () => {
    await purgeTenantReaderData(baseTenant(), env);

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
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

  it('only counts, never deletes, and records no audit event in dry-run mode', async () => {
    await purgeTenantReaderData(baseTenant(), { ...env, dryRun: true });

    expect(countSubscribersForTenantMock).toHaveBeenCalledWith('tenant-1');
    expect(countBookmarksForTenantMock).toHaveBeenCalledWith('tenant-1');
    expect(countMembershipInvitesForTenantMock).toHaveBeenCalledWith(
      'tenant-1',
    );
    expect(deleteSubscribersForTenantMock).not.toHaveBeenCalled();
    expect(deleteBookmarksForTenantMock).not.toHaveBeenCalled();
    expect(deleteMembershipInvitesForTenantMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('is idempotent — re-running after every table is already empty deletes nothing further and still records the (zero-count) purge', async () => {
    deleteSubscribersForTenantMock.mockResolvedValue(0);
    deleteBookmarksForTenantMock.mockResolvedValue(0);
    deleteMembershipInvitesForTenantMock.mockResolvedValue(0);

    await expect(
      purgeTenantReaderData(baseTenant(), env),
    ).resolves.toBeUndefined();

    expect(insertAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          subscribers: 0,
          bookmarks: 0,
          membershipInvites: 0,
        }),
      }),
    );
  });

  it('purges successfully and logs, without throwing, when the audit write fails', async () => {
    insertAuditEventMock.mockRejectedValueOnce(new Error('insert failed'));

    await expect(
      purgeTenantReaderData(baseTenant(), env),
    ).resolves.toBeUndefined();

    expect(deleteSubscribersForTenantMock).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('purges successfully and skips the audit write when GITHUB_ACTOR is unset', async () => {
    await expect(
      purgeTenantReaderData(baseTenant(), { ...env, githubActor: undefined }),
    ).resolves.toBeUndefined();

    expect(deleteSubscribersForTenantMock).toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});

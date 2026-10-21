import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  LOCALE_ISO_CODES,
} from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';

import { purgeTenantReaderData } from './purge-reader-data';

const {
  countTenantReaderDataMock,
  purgeTenantReaderDataMock,
  insertAuditEventMock,
} = vi.hoisted(() => ({
  countTenantReaderDataMock: vi.fn(),
  purgeTenantReaderDataMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@blog/db/queries/reader-data', () => ({
  countTenantReaderData: countTenantReaderDataMock,
  purgeTenantReaderData: purgeTenantReaderDataMock,
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

const PURGED_COUNTS = {
  subscribers: 3,
  bookmarks: 5,
  membershipInvites: 1,
  leads: 2,
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
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
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
  countTenantReaderDataMock.mockReset().mockResolvedValue(PURGED_COUNTS);
  purgeTenantReaderDataMock.mockReset().mockResolvedValue(PURGED_COUNTS);
  insertAuditEventMock.mockReset().mockResolvedValue({});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(purgeTenantReaderData, () => {
  it("purges the tenant's reader data through the shared purge", async () => {
    await purgeTenantReaderData(baseTenant(), env);

    expect(purgeTenantReaderDataMock).toHaveBeenCalledWith('tenant-1');
  });

  it('records exactly one READER_DATA_PURGED/TENANT audit event with the per-table counts', async () => {
    await purgeTenantReaderData(baseTenant(), env);

    expect(insertAuditEventMock).toHaveBeenCalledTimes(1);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'github:octocat',
      actorEmail: 'octocat@users.noreply.github.com',
      action: AUDIT_ACTION.READER_DATA_PURGED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: 'tenant-1',
      details: {
        via: 'deprovision-tenant-workflow',
        runId: 'run-42',
        ...PURGED_COUNTS,
      },
    });
  });

  it('only counts, never deletes, and records no audit event in dry-run mode', async () => {
    await purgeTenantReaderData(baseTenant(), { ...env, dryRun: true });

    expect(countTenantReaderDataMock).toHaveBeenCalledWith('tenant-1');
    expect(purgeTenantReaderDataMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('purges successfully and logs, without throwing, when the audit write fails', async () => {
    insertAuditEventMock.mockRejectedValueOnce(new Error('insert failed'));

    await expect(
      purgeTenantReaderData(baseTenant(), env),
    ).resolves.toBeUndefined();

    expect(purgeTenantReaderDataMock).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('purges successfully and skips the audit write when GITHUB_ACTOR is unset', async () => {
    await expect(
      purgeTenantReaderData(baseTenant(), { ...env, githubActor: undefined }),
    ).resolves.toBeUndefined();

    expect(purgeTenantReaderDataMock).toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});

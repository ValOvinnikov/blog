import { AUDIT_ACTION } from '@blog/config/constants';
import { TENANT_PROVISIONING_STEP } from '@blog/db/constants';

import type { TProvisionEnv } from './env';
import { recordProvisioningAuditEvent } from './record-provisioning-audit-event';

const { insertAuditEventMock } = vi.hoisted(() => ({
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@blog/db/queries/audit-events', () => ({
  insertAuditEvent: insertAuditEventMock,
}));

const env: TProvisionEnv = {
  sanityManagementToken: 'sanity-token',
  sanityOrganizationId: 'org-abc',
  vercelToken: 'vercel-token',
  vercelTeamId: undefined,
  vercelWebProjectId: 'proj-1',
  adminAppBaseUrl: 'https://admin.example.com',
  tenantSanityDataset: 'test-dataset',
  webAppBaseUrl: 'https://example.com',
  revalidateSecret: 'revalidate-shh',
  githubRunId: 'run-42',
  githubRepository: 'acme/blog',
  githubServerUrl: 'https://github.com',
  githubActor: 'octocat',
  tenantRegistryEnvironment: undefined,
  resendApiKey: undefined,
};

beforeEach(() => {
  insertAuditEventMock.mockReset().mockResolvedValue({});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(recordProvisioningAuditEvent, () => {
  it('inserts a PROVISIONED/TENANT audit event attributed to the GitHub actor, with no step key', async () => {
    await recordProvisioningAuditEvent(
      'tenant-1',
      env,
      AUDIT_ACTION.PROVISIONED,
    );

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'github:octocat',
      actorEmail: 'octocat@users.noreply.github.com',
      action: 'PROVISIONED',
      targetType: 'TENANT',
      targetId: 'tenant-1',
      details: { via: 'provision-tenant-workflow', runId: 'run-42' },
    });

    const [{ details }] = insertAuditEventMock.mock.calls[0] as [
      { details: Record<string, unknown> },
    ];
    expect(details).not.toHaveProperty('step');
  });

  it('includes the failing step key in details for a PROVISIONING_FAILED event', async () => {
    await recordProvisioningAuditEvent(
      'tenant-1',
      env,
      AUDIT_ACTION.PROVISIONING_FAILED,
      TENANT_PROVISIONING_STEP.SEED_CONTENT,
    );

    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: 'github:octocat',
      actorEmail: 'octocat@users.noreply.github.com',
      action: 'PROVISIONING_FAILED',
      targetType: 'TENANT',
      targetId: 'tenant-1',
      details: {
        via: 'provision-tenant-workflow',
        runId: 'run-42',
        step: TENANT_PROVISIONING_STEP.SEED_CONTENT,
      },
    });
  });

  it('omits the step key when a PROVISIONING_FAILED event has no failing step', async () => {
    await recordProvisioningAuditEvent(
      'tenant-1',
      env,
      AUDIT_ACTION.PROVISIONING_FAILED,
    );

    const [{ details }] = insertAuditEventMock.mock.calls[0] as [
      { details: Record<string, unknown> },
    ];
    expect(details).not.toHaveProperty('step');
  });

  it('logs and does not throw when the insert rejects', async () => {
    insertAuditEventMock.mockRejectedValueOnce(new Error('db down'));

    await expect(
      recordProvisioningAuditEvent('tenant-1', env, AUDIT_ACTION.PROVISIONED),
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalled();
  });

  it('logs and skips the insert when GITHUB_ACTOR is unset', async () => {
    await recordProvisioningAuditEvent(
      'tenant-1',
      { ...env, githubActor: undefined },
      AUDIT_ACTION.PROVISIONED,
    );

    expect(insertAuditEventMock).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});

import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
  WORKER_AUDIT_ACTOR_ID,
} from '@blog/config/constants';
import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TDeprovisioningStep,
} from '@blog/db/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events';
import { purgeTenantReaderData } from '@blog/db/queries/reader-data';
import { listTenantHosts } from '@blog/db/queries/tenant-domains/list-tenant-hosts';
import {
  archiveTenant,
  clearTenantProvisioningArtifacts,
  getTenantById,
  getTenantSanityManagementCredentials,
  updateDeprovisioningStep,
} from '@blog/db/queries/tenants';
import { archiveSanityProject } from '@blog/db/utils/sanity-management-client/sanity-project-lifecycle';
import {
  deleteSanityRobotToken,
  listSanityRobotTokens,
} from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import { requestTenantCacheInvalidation } from '@blog/db/utils/tenant-cache/request-tenant-cache-invalidation';
import { deleteVercelProjectDomains } from '@blog/db/utils/vercel-client/vercel-project-domains';
import { errorResult, okResult } from '@blog/utils/result';
import { faker } from '@faker-js/faker';
import {
  DEPROVISIONING_AUDIT_VIA,
  DEPROVISIONING_STEP_FAILED_EVENT,
  DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT,
} from '@worker/constants/deprovisioning';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { MOCK_NOW } from '@worker/testing/clock/frozen-clock';
import { MOCK_DEPROVISION_ENV } from '@worker/testing/deprovision-env/fake-deprovision-env';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import { MOCK_RUN_CONTEXT } from '@worker/testing/run/fixtures';
import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  MOCK_TENANT_MANAGEMENT_ROBOT_ID,
  MOCK_TENANT_MANAGEMENT_TOKEN,
  mockProvisionedTenant,
  mockTenant,
} from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { logger } from '@worker/utils/logger/logger';

import { runDeprovisioningStep } from './run-deprovisioning-step';

faker.seed(7011);

const MOCK_REVALIDATION_REFUSED = 'revalidation refused';
const MOCK_PROVISIONED_TENANT = mockProvisionedTenant();
const MOCK_READ_ROBOT_ID = faker.string.uuid();
const MOCK_WRITE_ROBOT_ID = faker.string.uuid();
const MOCK_HAND_MADE_ROBOT_ID = faker.string.uuid();
const MOCK_MANAGEMENT_CREDENTIALS = {
  projectId: MOCK_SANITY_PROJECT_ID,
  token: MOCK_TENANT_MANAGEMENT_TOKEN,
  managementRobotId: MOCK_TENANT_MANAGEMENT_ROBOT_ID,
};
const MOCK_TENANT_HOSTS = [
  MOCK_PROVISIONED_TENANT.primaryDomain,
  faker.internet.domainName(),
];
const MOCK_READER_DATA_COUNTS = {
  subscribers: 3,
  bookmarks: 5,
  membershipInvites: 1,
  leads: 2,
};

vi.mock('@blog/db/queries/audit-events');
vi.mock('@blog/db/queries/reader-data');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-lifecycle');
vi.mock('@blog/db/utils/sanity-management-client/sanity-robot-tokens');
vi.mock('@blog/db/utils/tenant-cache/request-tenant-cache-invalidation');
vi.mock('@blog/db/utils/vercel-client/vercel-project-domains');
vi.mock('@blog/db/queries/tenants');
vi.mock('@blog/db/queries/tenant-domains/list-tenant-hosts');
vi.mock(
  '@worker/utils/deprovision-env/deprovision-env',
  () => import('@worker/testing/deprovision-env/fake-deprovision-env'),
);
vi.mock('workflow');

function run(step: TDeprovisioningStep) {
  return runDeprovisioningStep(MOCK_TENANT_ID, MOCK_RUN_CONTEXT, step);
}

function reportedStatuses(): string[] {
  return vi
    .mocked(updateDeprovisioningStep)
    .mock.calls.map(([input]) => input.status);
}

describe(runDeprovisioningStep, () => {
  beforeEach(() => {
    atStepAttempt(1);
    vi.mocked(getTenantById).mockResolvedValue(MOCK_PROVISIONED_TENANT);
    vi.mocked(updateDeprovisioningStep).mockResolvedValue(
      okResult(MOCK_PROVISIONED_TENANT),
    );
    vi.mocked(archiveTenant).mockResolvedValue(
      okResult(MOCK_PROVISIONED_TENANT),
    );
    vi.mocked(listSanityRobotTokens).mockResolvedValue([]);
    vi.mocked(getTenantSanityManagementCredentials).mockResolvedValue(
      MOCK_MANAGEMENT_CREDENTIALS,
    );
    vi.mocked(purgeTenantReaderData).mockResolvedValue(MOCK_READER_DATA_COUNTS);
    vi.mocked(listTenantHosts).mockResolvedValue(MOCK_TENANT_HOSTS);
  });

  it('removes every tenant host from the web project and reports the step done', async () => {
    await expect(run(DEPROVISIONING_STEP.REMOVE_DOMAIN)).resolves.toEqual({
      ok: true,
      data: undefined,
    });

    expect(deleteVercelProjectDomains).toHaveBeenCalledWith({
      token: MOCK_DEPROVISION_ENV.vercelToken,
      teamId: MOCK_DEPROVISION_ENV.vercelTeamId,
      projectId: MOCK_DEPROVISION_ENV.vercelWebProjectId,
      domains: MOCK_TENANT_HOSTS,
    });
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.DONE,
    ]);
  });

  it("archives the tenant's Sanity project", async () => {
    await run(DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT);

    expect(archiveSanityProject).toHaveBeenCalledWith({
      token: MOCK_DEPROVISION_ENV.sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
    });
  });

  it('archives nothing for a tenant that never got a Sanity project', async () => {
    vi.mocked(getTenantById).mockResolvedValue(mockTenant());

    await expect(
      run(DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT),
    ).resolves.toEqual({ ok: true, data: undefined });

    expect(archiveSanityProject).not.toHaveBeenCalled();
  });

  it('revokes every Sanity robot token on the project, the management token last', async () => {
    vi.mocked(listSanityRobotTokens).mockResolvedValue([
      { id: MOCK_TENANT_MANAGEMENT_ROBOT_ID, label: faker.company.name() },
      { id: MOCK_READ_ROBOT_ID, label: faker.lorem.words(2) },
      { id: MOCK_WRITE_ROBOT_ID, label: faker.lorem.words(2) },
      { id: MOCK_HAND_MADE_ROBOT_ID, label: faker.internet.email() },
    ]);

    await run(DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS);

    expect(
      vi
        .mocked(deleteSanityRobotToken)
        .mock.calls.map(([input]) => input.robotId),
    ).toEqual([
      MOCK_READ_ROBOT_ID,
      MOCK_WRITE_ROBOT_ID,
      MOCK_HAND_MADE_ROBOT_ID,
      MOCK_TENANT_MANAGEMENT_ROBOT_ID,
    ]);
  });

  it("revokes with the tenant's own management token", async () => {
    vi.mocked(listSanityRobotTokens).mockResolvedValue([
      { id: MOCK_READ_ROBOT_ID, label: faker.lorem.words(2) },
    ]);

    await run(DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS);

    expect(deleteSanityRobotToken).toHaveBeenCalledWith({
      token: MOCK_TENANT_MANAGEMENT_TOKEN,
      projectId: MOCK_SANITY_PROJECT_ID,
      robotId: MOCK_READ_ROBOT_ID,
    });
  });

  it('logs and still succeeds when the tenant has no management token', async () => {
    vi.mocked(getTenantSanityManagementCredentials).mockResolvedValue(
      undefined,
    );

    await expect(
      run(DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS),
    ).resolves.toEqual({ ok: true, data: undefined });

    expect(listSanityRobotTokens).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });

  it('fails the step without revoking anything when the tenant has no stored management robot id', async () => {
    vi.mocked(getTenantSanityManagementCredentials).mockResolvedValue({
      ...MOCK_MANAGEMENT_CREDENTIALS,
      managementRobotId: null,
    });

    await expect(
      run(DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS),
    ).resolves.toEqual({
      ok: false,
      error: DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS,
    });

    expect(listSanityRobotTokens).not.toHaveBeenCalled();
    expect(deleteSanityRobotToken).not.toHaveBeenCalled();
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.FAILED,
    ]);
  });

  it('logs and still succeeds when the tokens cannot be revoked', async () => {
    vi.mocked(listSanityRobotTokens).mockRejectedValue(
      new Error(MOCK_SANITY_OUTAGE),
    );

    await expect(
      run(DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS),
    ).resolves.toEqual({ ok: true, data: undefined });

    expect(logger.error).toHaveBeenCalledWith(
      DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT,
      { tenantId: MOCK_TENANT_ID, error: MOCK_SANITY_OUTAGE },
    );
  });

  it("clears the tenant's provisioning artifacts", async () => {
    await run(DEPROVISIONING_STEP.CLEAR_ARTIFACTS);

    expect(clearTenantProvisioningArtifacts).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });

  it('archives the tenant row and audits the deprovisioning', async () => {
    await run(DEPROVISIONING_STEP.ARCHIVE_TENANT);

    expect(archiveTenant).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(insertAuditEvent).toHaveBeenCalledWith({
      actorId: WORKER_AUDIT_ACTOR_ID,
      action: AUDIT_ACTION.DEPROVISIONED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: { via: DEPROVISIONING_AUDIT_VIA, runId: MOCK_RUN_CONTEXT.runId },
    });
  });

  it('leaves an already-archived tenant row as it is', async () => {
    vi.mocked(getTenantById).mockResolvedValue(
      mockTenant({ deprovisionedAt: MOCK_NOW }),
    );

    await run(DEPROVISIONING_STEP.ARCHIVE_TENANT);

    expect(archiveTenant).not.toHaveBeenCalled();
    expect(insertAuditEvent).not.toHaveBeenCalled();
  });

  it("purges the tenant's reader data and records the counts", async () => {
    await run(DEPROVISIONING_STEP.PURGE_READER_DATA);

    expect(purgeTenantReaderData).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(insertAuditEvent).toHaveBeenCalledWith({
      actorId: WORKER_AUDIT_ACTOR_ID,
      action: AUDIT_ACTION.READER_DATA_PURGED,
      targetType: AUDIT_TARGET_TYPE.TENANT,
      targetId: MOCK_TENANT_ID,
      details: {
        via: DEPROVISIONING_AUDIT_VIA,
        runId: MOCK_RUN_CONTEXT.runId,
        ...MOCK_READER_DATA_COUNTS,
      },
    });
  });

  it("purges the tenant's site cache", async () => {
    await run(DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE);

    expect(requestTenantCacheInvalidation).toHaveBeenCalledWith({
      webAppUrl: MOCK_DEPROVISION_ENV.webAppBaseUrl,
      secret: MOCK_DEPROVISION_ENV.siteConfigRevalidateSecret,
      tenantId: MOCK_TENANT_ID,
    });
  });

  it('rethrows a failure on an attempt that still has retries left', async () => {
    vi.mocked(archiveTenant).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    await expect(run(DEPROVISIONING_STEP.ARCHIVE_TENANT)).rejects.toThrow(
      /could not be archived/,
    );
  });

  it('reports the step failed on its final attempt', async () => {
    atStepAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);
    vi.mocked(requestTenantCacheInvalidation).mockRejectedValue(
      new Error(MOCK_REVALIDATION_REFUSED),
    );

    await expect(
      run(DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE),
    ).resolves.toEqual({
      ok: false,
      error: DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE,
    });

    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.FAILED,
    ]);
    expect(logger.error).toHaveBeenCalledWith(
      DEPROVISIONING_STEP_FAILED_EVENT,
      {
        tenantId: MOCK_TENANT_ID,
        runId: MOCK_RUN_CONTEXT.runId,
        step: DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE,
        error: MOCK_REVALIDATION_REFUSED,
      },
    );
  });
});

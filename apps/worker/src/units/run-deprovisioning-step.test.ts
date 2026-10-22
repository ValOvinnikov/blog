import { AUDIT_ACTION, ERROR_CODE } from '@blog/config/constants';
import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TDeprovisioningStep,
} from '@blog/db/constants';
import { insertAuditEvent } from '@blog/db/queries/audit-events';
import { purgeTenantReaderData } from '@blog/db/queries/reader-data';
import {
  archiveTenant,
  clearTenantProvisioningArtifacts,
  getTenantById,
  updateDeprovisioningStep,
} from '@blog/db/queries/tenants';
import { archiveSanityProject } from '@blog/db/utils/sanity-management-client/sanity-project-lifecycle';
import {
  deleteSanityRobotToken,
  listSanityRobotTokens,
} from '@blog/db/utils/sanity-management-client/sanity-robot-tokens';
import {
  SANITY_READ_TOKEN_LABEL,
  SANITY_WRITE_TOKEN_LABEL,
} from '@blog/db/utils/sanity-management-client/sanity-token-labels';
import { requestTenantCacheInvalidation } from '@blog/db/utils/tenant-cache/request-tenant-cache-invalidation';
import { deleteVercelProjectDomain } from '@blog/db/utils/vercel-client/vercel-project-domains';
import {
  DEPROVISIONING_STEP_FAILED_EVENT,
  DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT,
} from '@worker/constants/deprovisioning';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { SANITY_PROJECT_ID } from '@worker/testing/owner-access/fixtures';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { getDeprovisionEnv } from '@worker/utils/deprovision-env/deprovision-env';
import { logger } from '@worker/utils/logger/logger';
import { getStepMetadata } from 'workflow';

import { runDeprovisioningStep } from './run-deprovisioning-step';

const CTX = { runId: 'deprovision-step-run' };
const SANITY_OUTAGE = 'Access API unavailable';
const SECRET_MISMATCH = 'revalidation refused';
const PROVISIONED_TENANT = makeTenant({ sanityProjectId: SANITY_PROJECT_ID });
const READ_ROBOT_ID = 'provisioned-read-robot';
const WRITE_ROBOT_ID = 'provisioned-write-robot';
const READER_DATA_COUNTS = {
  subscribers: 3,
  bookmarks: 5,
  membershipInvites: 1,
  leads: 2,
};

vi.mock('@worker/utils/logger/logger');
vi.mock('@blog/db/queries/audit-events');
vi.mock('@blog/db/queries/reader-data');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-lifecycle');
vi.mock('@blog/db/utils/sanity-management-client/sanity-robot-tokens');
vi.mock('@blog/db/utils/tenant-cache/request-tenant-cache-invalidation');
vi.mock('@blog/db/utils/vercel-client/vercel-project-domains');
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);
vi.mock(
  '@worker/utils/deprovision-env/deprovision-env',
  () => import('@worker/testing/deprovision-env/fake-deprovision-env'),
);
vi.mock('workflow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('workflow')>()),
  getStepMetadata: vi.fn(),
}));

function onAttempt(attempt: number): void {
  vi.mocked(getStepMetadata).mockReturnValue({
    attempt,
  } as ReturnType<typeof getStepMetadata>);
}

function run(step: TDeprovisioningStep) {
  return runDeprovisioningStep(TEST_TENANT_ID, CTX, step);
}

function reportedStatuses(): string[] {
  return vi
    .mocked(updateDeprovisioningStep)
    .mock.calls.map(([input]) => input.status);
}

describe(runDeprovisioningStep, () => {
  beforeEach(() => {
    onAttempt(1);
    vi.mocked(getTenantById).mockResolvedValue(PROVISIONED_TENANT);
    vi.mocked(updateDeprovisioningStep).mockResolvedValue({
      ok: true,
      data: PROVISIONED_TENANT,
    });
    vi.mocked(archiveTenant).mockResolvedValue({
      ok: true,
      data: PROVISIONED_TENANT,
    });
    vi.mocked(listSanityRobotTokens).mockResolvedValue([]);
    vi.mocked(purgeTenantReaderData).mockResolvedValue(READER_DATA_COUNTS);
  });

  it("removes the tenant's domain from the web project and reports the step done", async () => {
    await expect(run(DEPROVISIONING_STEP.REMOVE_DOMAIN)).resolves.toEqual({
      ok: true,
    });

    expect(deleteVercelProjectDomain).toHaveBeenCalledWith({
      token: getDeprovisionEnv().vercelToken,
      teamId: undefined,
      projectId: getDeprovisionEnv().vercelWebProjectId,
      domain: PROVISIONED_TENANT.primaryDomain,
    });
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.DONE,
    ]);
  });

  it("archives the tenant's Sanity project", async () => {
    await run(DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT);

    expect(archiveSanityProject).toHaveBeenCalledWith({
      token: getDeprovisionEnv().sanityManagementToken,
      projectId: SANITY_PROJECT_ID,
    });
  });

  it('archives nothing for a tenant that never got a Sanity project', async () => {
    vi.mocked(getTenantById).mockResolvedValue(makeTenant());

    await expect(
      run(DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT),
    ).resolves.toEqual({ ok: true });

    expect(archiveSanityProject).not.toHaveBeenCalled();
  });

  it('revokes only the provisioned Sanity robot tokens', async () => {
    vi.mocked(listSanityRobotTokens).mockResolvedValue([
      { id: READ_ROBOT_ID, label: SANITY_READ_TOKEN_LABEL },
      { id: WRITE_ROBOT_ID, label: SANITY_WRITE_TOKEN_LABEL },
      { id: 'robot-other', label: 'hand-made' },
    ]);

    await run(DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS);

    expect(
      vi
        .mocked(deleteSanityRobotToken)
        .mock.calls.map(([input]) => input.robotId),
    ).toEqual([READ_ROBOT_ID, WRITE_ROBOT_ID]);
  });

  it('logs and still succeeds when the tokens cannot be revoked', async () => {
    vi.mocked(listSanityRobotTokens).mockRejectedValue(
      new Error(SANITY_OUTAGE),
    );

    await expect(
      run(DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS),
    ).resolves.toEqual({ ok: true });

    expect(logger.error).toHaveBeenCalledWith(
      DEPROVISIONING_TOKEN_REVOKE_FAILED_EVENT,
      { tenantId: TEST_TENANT_ID, error: SANITY_OUTAGE },
    );
  });

  it("clears the tenant's provisioning artifacts", async () => {
    await run(DEPROVISIONING_STEP.CLEAR_ARTIFACTS);

    expect(clearTenantProvisioningArtifacts).toHaveBeenCalledWith(
      TEST_TENANT_ID,
    );
  });

  it('archives the tenant row and records the deprovisioned audit event', async () => {
    await run(DEPROVISIONING_STEP.ARCHIVE_TENANT);

    expect(archiveTenant).toHaveBeenCalledWith(TEST_TENANT_ID);
    expect(insertAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.DEPROVISIONED,
        targetId: TEST_TENANT_ID,
      }),
    );
  });

  it('leaves an already-archived tenant row as it is', async () => {
    vi.mocked(getTenantById).mockResolvedValue(
      makeTenant({ deprovisionedAt: new Date(0) }),
    );

    await run(DEPROVISIONING_STEP.ARCHIVE_TENANT);

    expect(archiveTenant).not.toHaveBeenCalled();
    expect(insertAuditEvent).not.toHaveBeenCalled();
  });

  it("purges the tenant's reader data and records the counts", async () => {
    await run(DEPROVISIONING_STEP.PURGE_READER_DATA);

    expect(purgeTenantReaderData).toHaveBeenCalledWith(TEST_TENANT_ID);
    expect(insertAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTION.READER_DATA_PURGED,
        details: expect.objectContaining(READER_DATA_COUNTS),
      }),
    );
  });

  it("purges the tenant's site cache", async () => {
    await run(DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE);

    expect(requestTenantCacheInvalidation).toHaveBeenCalledWith({
      webAppUrl: getDeprovisionEnv().webAppBaseUrl,
      secret: getDeprovisionEnv().siteConfigRevalidateSecret,
      tenantId: TEST_TENANT_ID,
    });
  });

  it('rethrows a failure on an attempt that still has retries left', async () => {
    vi.mocked(archiveTenant).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });

    await expect(run(DEPROVISIONING_STEP.ARCHIVE_TENANT)).rejects.toThrow(
      /could not be archived/,
    );
  });

  it('reports the step failed on its final attempt', async () => {
    onAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);
    vi.mocked(requestTenantCacheInvalidation).mockRejectedValue(
      new Error(SECRET_MISMATCH),
    );

    await expect(
      run(DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE),
    ).resolves.toEqual({
      ok: false,
      failedStep: DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE,
    });

    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.FAILED,
    ]);
    expect(logger.error).toHaveBeenCalledWith(
      DEPROVISIONING_STEP_FAILED_EVENT,
      {
        tenantId: TEST_TENANT_ID,
        runId: CTX.runId,
        step: DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE,
        error: SECRET_MISMATCH,
      },
    );
  });
});

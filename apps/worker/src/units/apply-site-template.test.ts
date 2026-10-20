import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import {
  getTenantById,
  updateProvisioningStep,
} from '@blog/db/queries/tenants';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { seedTenantContent } from '@worker/utils/db-provisioning-steps/db-provisioning-steps';
import { FatalError, getStepMetadata } from 'workflow';

import { applySiteTemplate } from './apply-site-template';

const CTX = { runId: 'run-1' };

vi.mock('@worker/utils/logger/logger');
vi.mock('@blog/db/queries/tenants', async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(
    await importOriginal<typeof import('@blog/db/queries/tenants')>(),
  ),
);
vi.mock(
  '@worker/utils/provision-env/provision-env',
  () => import('@worker/testing/provision-env/fake-provision-env'),
);
vi.mock(
  '@worker/utils/db-provisioning-steps/db-provisioning-steps',
  async (importOriginal) =>
    (
      await import('@worker/testing/db-provisioning-steps/fake-db-provisioning-steps')
    ).withFakeProvisioningSteps(
      await importOriginal<
        typeof import('@worker/utils/db-provisioning-steps/db-provisioning-steps')
      >(),
      ['seedTenantContent'],
    ),
);
vi.mock('workflow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('workflow')>()),
  getStepMetadata: vi.fn(),
}));

function reportedStatuses(): string[] {
  return vi
    .mocked(updateProvisioningStep)
    .mock.calls.map(([input]) => input.status);
}

describe(applySiteTemplate, () => {
  beforeEach(() => {
    vi.mocked(getStepMetadata).mockReturnValue({
      attempt: 1,
    } as ReturnType<typeof getStepMetadata>);
    vi.mocked(getTenantById).mockResolvedValue(makeTenant());
    vi.mocked(updateProvisioningStep).mockResolvedValue({
      ok: false,
      error: ERROR_CODE.DB_NOT_FOUND,
    });
  });

  it('seeds the tenant and reports SEED_CONTENT running then done', async () => {
    const result = await applySiteTemplate(TEST_TENANT_ID, CTX);

    expect(result).toEqual({ ok: true });
    expect(seedTenantContent).toHaveBeenCalledOnce();
    expect(reportedStatuses()).toEqual([
      TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      TENANT_PROVISIONING_STEP_STATUS.DONE,
    ]);
    expect(updateProvisioningStep).toHaveBeenCalledWith(
      expect.objectContaining({ step: TENANT_PROVISIONING_STEP.SEED_CONTENT }),
    );
  });

  it('throws a fatal error without seeding for a missing tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    await expect(applySiteTemplate(TEST_TENANT_ID, CTX)).rejects.toThrow(
      FatalError,
    );

    expect(seedTenantContent).not.toHaveBeenCalled();
  });
});

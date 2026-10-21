import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import {
  getTenantById,
  updateProvisioningStep,
} from '@blog/db/queries/tenants';
import { verifyTenantSeededContent } from '@worker/steps/verify-seeded-content';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { getStepMetadata } from 'workflow';

import { verifyTenant } from './verify-tenant';

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
vi.mock('@worker/steps/verify-seeded-content');
vi.mock('workflow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('workflow')>()),
  getStepMetadata: vi.fn(),
}));

describe(verifyTenant, () => {
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

  it('verifies the seeded content and reports VERIFY_CONTENT done', async () => {
    const result = await verifyTenant(TEST_TENANT_ID, CTX);

    expect(result).toEqual({ ok: true });
    expect(verifyTenantSeededContent).toHaveBeenCalledOnce();
    expect(updateProvisioningStep).toHaveBeenLastCalledWith(
      expect.objectContaining({
        step: TENANT_PROVISIONING_STEP.VERIFY_CONTENT,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      }),
    );
  });

  it('reports the failed step when verification keeps failing', async () => {
    vi.mocked(getStepMetadata).mockReturnValue({
      attempt: 99,
    } as ReturnType<typeof getStepMetadata>);
    vi.mocked(verifyTenantSeededContent).mockRejectedValue(
      new Error('webhook missing'),
    );

    const result = await verifyTenant(TEST_TENANT_ID, CTX);

    expect(result).toEqual({
      ok: false,
      failedStep: TENANT_PROVISIONING_STEP.VERIFY_CONTENT,
    });
  });
});

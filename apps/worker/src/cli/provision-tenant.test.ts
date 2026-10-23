import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
} from '@blog/db/constants';
import {
  beginTenantProvisioning,
  setTenantProvisioningStatus,
} from '@blog/db/queries/tenants';
import { errorResult, okResult } from '@blog/utils/result';
import { PROVISION_CLI_RESULT } from '@worker/constants/provisioning';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { runProvisioningSequence } from '@worker/workflows/provisioning-sequence';

import { provisionTenantOnce } from './provision-tenant';

vi.mock('@worker/workflows/provisioning-sequence');
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);

describe(provisionTenantOnce, () => {
  beforeEach(() => {
    vi.mocked(beginTenantProvisioning).mockResolvedValue(
      okResult({ tenant: makeTenant(), previousProvisioningStatus: null }),
    );
    vi.mocked(runProvisioningSequence).mockResolvedValue(okResult());
  });

  it('runs the provisioning sequence once, without durable retries', async () => {
    const result = await provisionTenantOnce(TEST_TENANT_ID);

    expect(result).toBe(PROVISION_CLI_RESULT.SUCCEEDED);
    expect(runProvisioningSequence).toHaveBeenCalledWith(TEST_TENANT_ID, {
      runId: expect.stringMatching(/^cli-/),
      isOneShot: true,
    });
  });

  it('reports a failed run when a unit fails', async () => {
    vi.mocked(runProvisioningSequence).mockResolvedValue(
      errorResult({ failedStep: TENANT_PROVISIONING_STEP.SEED_CONTENT }),
    );

    const result = await provisionTenantOnce(TEST_TENANT_ID);

    expect(result).toBe(PROVISION_CLI_RESULT.FAILED);
  });

  it.each([
    [
      ERROR_CODE.DB_ALREADY_PROVISIONING,
      PROVISION_CLI_RESULT.ALREADY_IN_PROGRESS,
    ],
    [ERROR_CODE.DB_NOT_FOUND, PROVISION_CLI_RESULT.NOT_FOUND],
  ])(
    'refuses to start when the row guard answers %s',
    async (error, expected) => {
      vi.mocked(beginTenantProvisioning).mockResolvedValue(errorResult(error));

      const result = await provisionTenantOnce(TEST_TENANT_ID);

      expect(result).toBe(expected);
      expect(runProvisioningSequence).not.toHaveBeenCalled();
    },
  );

  it('settles the tenant FAILED and rethrows when the run crashes', async () => {
    const crash = new Error('registry unreachable');
    vi.mocked(runProvisioningSequence).mockRejectedValue(crash);

    await expect(provisionTenantOnce(TEST_TENANT_ID)).rejects.toBe(crash);

    expect(setTenantProvisioningStatus).toHaveBeenCalledWith(
      TEST_TENANT_ID,
      TENANT_PROVISIONING_STATUS.FAILED,
    );
  });
});

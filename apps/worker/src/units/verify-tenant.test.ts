import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import {
  getTenantById,
  updateProvisioningStep,
} from '@blog/db/queries/tenants';
import { errorResult } from '@blog/utils/result';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { verifyTenantSeededContent } from '@worker/steps/verify-seeded-content';
import { MOCK_RUN_CONTEXT } from '@worker/testing/run/fixtures';
import { mockTenant, MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';

import { verifyTenant } from './verify-tenant';

vi.mock('@blog/db/queries/tenants');
vi.mock('@worker/utils/provision-env/provision-env');
vi.mock('@worker/steps/verify-seeded-content');
vi.mock('workflow');

describe(verifyTenant, () => {
  beforeEach(() => {
    atStepAttempt(1);
    vi.mocked(getTenantById).mockResolvedValue(mockTenant());
    vi.mocked(updateProvisioningStep).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );
  });

  it('verifies the seeded content and reports VERIFY_CONTENT done', async () => {
    const result = await verifyTenant(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    const [report] = vi.mocked(updateProvisioningStep).mock.lastCall ?? [];
    expect(result).toEqual({ ok: true, data: undefined });
    expect(verifyTenantSeededContent).toHaveBeenCalledOnce();
    expect(report?.step).toBe(TENANT_PROVISIONING_STEP.VERIFY_CONTENT);
    expect(report?.status).toBe(TENANT_PROVISIONING_STEP_STATUS.DONE);
  });

  it('reports the failed step when verification keeps failing', async () => {
    atStepAttempt(PROVISIONING_UNIT_MAX_RETRIES + 1);
    vi.mocked(verifyTenantSeededContent).mockRejectedValue(
      new Error('webhook missing'),
    );

    const result = await verifyTenant(MOCK_TENANT_ID, MOCK_RUN_CONTEXT);

    expect(result).toEqual({
      ok: false,
      error: TENANT_PROVISIONING_STEP.VERIFY_CONTENT,
    });
  });
});

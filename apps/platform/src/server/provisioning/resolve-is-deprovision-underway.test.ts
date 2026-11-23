import {
  MOCK_RUN_PLUS_1_MIN_AT,
  MOCK_RUN_PLUS_2_MIN_AT,
  MOCK_RUN_STARTED_AT,
  MOCK_TENANT_ID,
  mockIdleDeprovisioningSteps,
  mockIdleProvisioningSteps,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { queries } from '@shinefold/db';

import { resolveIsDeprovisionUnderway } from './resolve-is-deprovision-underway';

vi.mock('@shinefold/db', () => ({
  queries: { auditEvents: { getLatestDeprovisionRequestedAt: vi.fn() } },
}));

const getLatestDeprovisionRequestedAtMock = vi.mocked(
  queries.auditEvents.getLatestDeprovisionRequestedAt,
);

describe(resolveIsDeprovisionUnderway, () => {
  beforeEach(() => {
    getLatestDeprovisionRequestedAtMock
      .mockReset()
      .mockResolvedValue(new Date(MOCK_RUN_PLUS_1_MIN_AT));
  });

  it('reads the request for the given tenant', async () => {
    await resolveIsDeprovisionUnderway(mockTenant());

    expect(getLatestDeprovisionRequestedAtMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });

  it('drops a request the provisioning run started after', async () => {
    const tenant = mockTenant({
      provisioningSteps: {
        ...mockIdleProvisioningSteps(),
        run: { startedAt: MOCK_RUN_PLUS_2_MIN_AT },
      },
    });

    await expect(resolveIsDeprovisionUnderway(tenant)).resolves.toBe(false);
  });

  it('settles the request once the deprovisioning run finished after it', async () => {
    const tenant = mockTenant({
      deprovisioningSteps: {
        ...mockIdleDeprovisioningSteps(),
        run: {
          startedAt: MOCK_RUN_STARTED_AT,
          finishedAt: MOCK_RUN_PLUS_2_MIN_AT,
        },
      },
    });

    await expect(resolveIsDeprovisionUnderway(tenant)).resolves.toBe(false);
  });
});

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
import { isUndefined } from '@shinefold/utils/primitives';

import { resolveIsDeprovisionUnderway } from './resolve-is-deprovision-underway';

vi.mock('@shinefold/db', () => ({
  queries: { auditEvents: { getLatestDeprovisionRequestedAt: vi.fn() } },
}));

const getLatestDeprovisionRequestedAtMock = vi.mocked(
  queries.auditEvents.getLatestDeprovisionRequestedAt,
);

const finishedDeprovisioningSteps = {
  ...mockIdleDeprovisioningSteps(),
  run: { startedAt: MOCK_RUN_STARTED_AT, finishedAt: MOCK_RUN_PLUS_1_MIN_AT },
};

describe(resolveIsDeprovisionUnderway, () => {
  beforeEach(() => {
    getLatestDeprovisionRequestedAtMock
      .mockReset()
      .mockResolvedValue(undefined);
  });

  it('reads the request for the given tenant', async () => {
    await resolveIsDeprovisionUnderway(mockTenant());

    expect(getLatestDeprovisionRequestedAtMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });

  it.each([
    {
      state: 'a tenant never deprovisioned',
      requestedAt: undefined,
      overrides: {},
      isUnderway: false,
    },
    {
      state: 'a request waiting for its run',
      requestedAt: MOCK_RUN_PLUS_2_MIN_AT,
      overrides: { deprovisioningSteps: finishedDeprovisioningSteps },
      isUnderway: true,
    },
    {
      state: 'an unfinished deprovisioning run',
      requestedAt: undefined,
      overrides: {
        deprovisioningSteps: {
          ...mockIdleDeprovisioningSteps(),
          run: { startedAt: MOCK_RUN_STARTED_AT },
        },
      },
      isUnderway: true,
    },
    {
      state: 'a failed requested run',
      requestedAt: MOCK_RUN_STARTED_AT,
      overrides: { deprovisioningSteps: finishedDeprovisioningSteps },
      isUnderway: false,
    },
    {
      state: 'a request a reactivation superseded',
      requestedAt: MOCK_RUN_STARTED_AT,
      overrides: {
        provisioningSteps: {
          ...mockIdleProvisioningSteps(),
          run: { startedAt: MOCK_RUN_PLUS_2_MIN_AT },
        },
      },
      isUnderway: false,
    },
  ])(
    'reports $isUnderway for $state',
    async ({ requestedAt, overrides, isUnderway }) => {
      getLatestDeprovisionRequestedAtMock.mockResolvedValue(
        isUndefined(requestedAt) ? undefined : new Date(requestedAt),
      );

      await expect(
        resolveIsDeprovisionUnderway(mockTenant(overrides)),
      ).resolves.toBe(isUnderway);
    },
  );
});

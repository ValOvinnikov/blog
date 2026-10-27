import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { faker } from '@faker-js/faker';

import { reportOwnerElevationOutcome } from './report-owner-elevation-outcome';

faker.seed(5807);

const { updateProvisioningStepMock } = vi.hoisted(() => ({
  updateProvisioningStepMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  updateProvisioningStep: updateProvisioningStepMock,
}));

const MOCK_TENANT_ID = faker.string.uuid();

beforeEach(() => {
  updateProvisioningStepMock.mockResolvedValue({ ok: true, data: undefined });
});

describe(reportOwnerElevationOutcome, () => {
  it.each(Object.values(ELEVATE_TENANT_OWNER_OUTCOME))(
    'reports the OWNER_ELEVATION step DONE with detail %s',
    async (outcome) => {
      await reportOwnerElevationOutcome(MOCK_TENANT_ID, outcome);

      expect(updateProvisioningStepMock.mock.calls).toEqual([
        [
          {
            tenantId: MOCK_TENANT_ID,
            step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            detail: outcome,
          },
        ],
      ]);
    },
  );

  it('records the notified outcome in the same write when a notification fired', async () => {
    await reportOwnerElevationOutcome(
      MOCK_TENANT_ID,
      ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
    );

    expect(updateProvisioningStepMock.mock.calls).toEqual([
      [
        {
          tenantId: MOCK_TENANT_ID,
          step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          detail: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
          notifiedOwnerElevationOutcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
        },
      ],
    ]);
  });
});

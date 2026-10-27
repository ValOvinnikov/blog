import { ELEVATE_TENANT_OWNER_OUTCOME } from '@blog/db/constants';
import { mockTenant } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import type * as NotifyOperators from './notify-operators';
import { notifyOwnerElevationOutcome } from './notify-owner-elevation-outcome';

faker.seed(5806);

const { notifyOperatorsOfOwnerElevationOutcomeMock } = vi.hoisted(() => ({
  notifyOperatorsOfOwnerElevationOutcomeMock: vi.fn(),
}));

vi.mock('./notify-operators', async (importOriginal) => {
  const actual = await importOriginal<typeof NotifyOperators>();
  return {
    ...actual,
    notifyOperatorsOfOwnerElevationOutcome:
      notifyOperatorsOfOwnerElevationOutcomeMock,
  };
});

describe(notifyOwnerElevationOutcome, () => {
  it('notifies and returns the outcome sent when never notified before', async () => {
    const tenant = mockTenant({ lastNotifiedOwnerElevationOutcome: null });

    const result = await notifyOwnerElevationOutcome({
      tenant,
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
    });

    expect(notifyOperatorsOfOwnerElevationOutcomeMock.mock.calls).toEqual([
      [{ tenant, outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED }],
    ]);
    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.STALLED);
  });

  it('does not re-notify when the outcome matches the one already notified', async () => {
    const result = await notifyOwnerElevationOutcome({
      tenant: mockTenant({
        lastNotifiedOwnerElevationOutcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      }),
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
    });

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('notifies again when the outcome changes to a different notifiable one', async () => {
    const result = await notifyOwnerElevationOutcome({
      tenant: mockTenant({
        lastNotifiedOwnerElevationOutcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      }),
      outcome: ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP,
    });

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP);
  });

  it.each([
    ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED,
    ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR,
    ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE,
  ])('never notifies for the non-notifiable outcome %s', async (outcome) => {
    const result = await notifyOwnerElevationOutcome({
      tenant: mockTenant(),
      outcome,
    });

    expect(notifyOperatorsOfOwnerElevationOutcomeMock).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});

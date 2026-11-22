import { STRIPE_EVENT_TYPE } from '@platform/constants/stripe-event';
import { MOCK_SCHEDULE_ID } from '@platform/testing/billing/plan-subscription';
import { mockStripePlanChangeClient } from '@platform/testing/billing/stripe-plan-change-client';
import {
  mockPendingUpdateClearedEvent,
  mockStripeEvent,
  mockStripeSubscription,
} from '@platform/testing/billing/stripe-subscription';

import { releaseAppliedUpdateSchedule } from './release-applied-update-schedule';

describe(releaseAppliedUpdateSchedule, () => {
  let client: ReturnType<typeof mockStripePlanChangeClient>;

  beforeEach(() => {
    client = mockStripePlanChangeClient(mockStripeSubscription());
  });

  it('releases the planned move once a held move up is applied', async () => {
    await releaseAppliedUpdateSchedule(
      client.stripe,
      mockPendingUpdateClearedEvent({}, { isApplied: true }),
    );

    expect(client.releaseSchedule).toHaveBeenCalledExactlyOnceWith(
      MOCK_SCHEDULE_ID,
    );
  });

  it.each([
    [
      'a held move up that expired',
      mockPendingUpdateClearedEvent({}, { isApplied: false }),
    ],
    [
      'an applied move up with nothing planned',
      mockPendingUpdateClearedEvent({ schedule: null }, { isApplied: true }),
    ],
    ['an update with no held change', mockStripeEvent()],
    [
      'another event type',
      mockStripeEvent(STRIPE_EVENT_TYPE.SUBSCRIPTION_CREATED),
    ],
  ])('keeps the planned move after %s', async (_case, event) => {
    await releaseAppliedUpdateSchedule(client.stripe, event);

    expect(client.releaseSchedule).not.toHaveBeenCalled();
  });
});

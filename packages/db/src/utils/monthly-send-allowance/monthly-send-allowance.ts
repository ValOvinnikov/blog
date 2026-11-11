import {
  PLAN_MONTHLY_SENDS_PER_SUBSCRIBER,
  SUBSCRIBER_BAND_CEILINGS,
  type TTenantPlan,
} from '@blog/db/constants';

function subscriberBandCeiling(activeSubscriberCount: number): number {
  return (
    SUBSCRIBER_BAND_CEILINGS.find(
      (ceiling) => activeSubscriberCount <= ceiling,
    ) ?? activeSubscriberCount
  );
}

export function monthlySendAllowance(
  plan: TTenantPlan,
  activeSubscriberCount: number,
): number {
  return (
    PLAN_MONTHLY_SENDS_PER_SUBSCRIBER[plan] *
    subscriberBandCeiling(activeSubscriberCount)
  );
}

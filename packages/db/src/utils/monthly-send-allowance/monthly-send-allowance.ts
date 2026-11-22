import type { TTenantPlan } from '@shinefold/config/constants';
import {
  PLAN_MONTHLY_SENDS_PER_SUBSCRIBER,
  type TSubscriberBandCeiling,
} from '@shinefold/db/constants';

export function monthlySendAllowance(
  plan: TTenantPlan,
  bandCeiling: TSubscriberBandCeiling,
): number {
  return PLAN_MONTHLY_SENDS_PER_SUBSCRIBER[plan] * bandCeiling;
}

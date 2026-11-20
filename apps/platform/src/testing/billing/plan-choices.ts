import type { TPlanChoice } from '@platform/constants/plan-change';
import { TENANT_PLAN, BILLING_INTERVAL } from '@shinefold/config/constants';

export const MOCK_STARTER_MONTHLY_CHOICE: TPlanChoice = {
  plan: TENANT_PLAN.STARTER,
  interval: BILLING_INTERVAL.MONTHLY,
};
export const MOCK_STARTER_YEARLY_CHOICE: TPlanChoice = {
  plan: TENANT_PLAN.STARTER,
  interval: BILLING_INTERVAL.YEARLY,
};
export const MOCK_GROWTH_MONTHLY_CHOICE: TPlanChoice = {
  plan: TENANT_PLAN.GROWTH,
  interval: BILLING_INTERVAL.MONTHLY,
};
export const MOCK_GROWTH_YEARLY_CHOICE: TPlanChoice = {
  plan: TENANT_PLAN.GROWTH,
  interval: BILLING_INTERVAL.YEARLY,
};

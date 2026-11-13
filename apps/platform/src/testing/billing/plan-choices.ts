import { TENANT_PLAN } from '@blog/config/constants';
import { BILLING_INTERVAL } from '@platform/constants/billing';
import type { TPlanChoice } from '@platform/constants/plan-change';

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

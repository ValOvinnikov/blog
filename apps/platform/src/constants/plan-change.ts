import type { TSellableTenantPlan } from '@blog/config/constants';
import type { TValueOf } from '@blog/config/utils';
import {
  type UPGRADE_STATE,
  BILLING_INTERVAL,
  type TBillingInterval,
} from '@platform/constants/billing';

export type TPlanChoice = {
  plan: TSellableTenantPlan;
  interval: TBillingInterval;
};

export const STRIPE_RECURRING_INTERVAL = {
  [BILLING_INTERVAL.MONTHLY]: 'month',
  [BILLING_INTERVAL.YEARLY]: 'year',
} as const;

export const PLAN_CHANGE_TIMING = {
  NOW: 'NOW',
  AT_RENEWAL: 'AT_RENEWAL',
  CANCEL_PENDING: 'CANCEL_PENDING',
} as const;

export type TPlanChangeTiming = TValueOf<typeof PLAN_CHANGE_TIMING>;

export const PLAN_CHANGE_REFUSAL = {
  NOT_SUBSCRIBED: 'NOT_SUBSCRIBED',
  NOT_ACTIVE: 'NOT_ACTIVE',
  UNCHANGED: 'UNCHANGED',
  CARD_DECLINED: 'CARD_DECLINED',
} as const;

export type TPlanChangeGate =
  | typeof UPGRADE_STATE.NOT_OWNER
  | typeof UPGRADE_STATE.UNAVAILABLE
  | typeof PLAN_CHANGE_REFUSAL.NOT_SUBSCRIBED;

export type TPlanChangeRefusal =
  TPlanChangeGate | TValueOf<typeof PLAN_CHANGE_REFUSAL>;

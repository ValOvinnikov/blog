import type { UPGRADE_STATE } from '@platform/constants/billing';
import {
  type TBillingInterval,
  type TSellableTenantPlan,
} from '@shinefold/config/constants';
import type { TValueOf } from '@shinefold/config/utils';

export type TPlanChoice = {
  plan: TSellableTenantPlan;
  interval: TBillingInterval;
};

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
  PAYMENT_NOT_CONFIRMED: 'PAYMENT_NOT_CONFIRMED',
  NO_NEXT_BAND: 'NO_NEXT_BAND',
  PENDING_CHANGE: 'PENDING_CHANGE',
} as const;

export type TPlanChangeRefusalCode = TValueOf<typeof PLAN_CHANGE_REFUSAL>;

export const PLAN_CHANGE_PAYMENT_REFUSALS = [
  PLAN_CHANGE_REFUSAL.CARD_DECLINED,
  PLAN_CHANGE_REFUSAL.PAYMENT_NOT_CONFIRMED,
] as const;

export type TPlanChangeGate =
  | typeof UPGRADE_STATE.NOT_OWNER
  | typeof UPGRADE_STATE.UNAVAILABLE
  | typeof PLAN_CHANGE_REFUSAL.NOT_SUBSCRIBED;

export type TPlanChangeRefusal =
  | typeof UPGRADE_STATE.NOT_OWNER
  | typeof UPGRADE_STATE.UNAVAILABLE
  | TPlanChangeRefusalCode;

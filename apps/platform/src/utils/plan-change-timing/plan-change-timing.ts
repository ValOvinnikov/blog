import type { TMaybeUndefined } from '@blog/config';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import { BILLING_INTERVAL } from '@platform/constants/billing';
import {
  PLAN_CHANGE_TIMING,
  type TPlanChoice,
} from '@platform/constants/plan-change';

// Key order is the rank; a shorter period waits for renewal even when the plan moves up.
const PLAN_ORDER: string[] = Object.keys(PLAN_ENTITLEMENTS);
const INTERVAL_ORDER: string[] = Object.values(BILLING_INTERVAL);

export const isSamePlanChoice = (a: TPlanChoice, b: TPlanChoice): boolean =>
  a.plan === b.plan && a.interval === b.interval;

export const planChangeTiming = (
  from: TPlanChoice,
  to: TPlanChoice,
): TMaybeUndefined<
  typeof PLAN_CHANGE_TIMING.NOW | typeof PLAN_CHANGE_TIMING.AT_RENEWAL
> => {
  const intervalStep =
    INTERVAL_ORDER.indexOf(to.interval) - INTERVAL_ORDER.indexOf(from.interval);
  if (intervalStep < 0) return PLAN_CHANGE_TIMING.AT_RENEWAL;
  const step =
    PLAN_ORDER.indexOf(to.plan) - PLAN_ORDER.indexOf(from.plan) || intervalStep;
  if (step === 0) return undefined;
  return step > 0 ? PLAN_CHANGE_TIMING.NOW : PLAN_CHANGE_TIMING.AT_RENEWAL;
};

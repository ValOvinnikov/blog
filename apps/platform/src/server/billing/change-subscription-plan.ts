import 'server-only';

import { BILLING_LOG } from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  PLAN_CHANGE_TIMING,
  type TPlanChangeTiming,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import { logger } from '@platform/utils/logger/logger';
import { planChangeTiming } from '@platform/utils/plan-change-timing/plan-change-timing';
import type Stripe from 'stripe';

import { changePlanNow, type TChangeNowResult } from './change-plan-now';
import { findTargetPrices } from './find-target-prices';
import type { TSubscriptionPlan } from './load-subscription-plan';
import { releaseSchedule } from './release-schedule';
import { scheduleChangeAtRenewal } from './schedule-change-at-renewal';

export type TPlanChangeResult =
  TPlanChangeTiming | TChangeNowResult | typeof PLAN_CHANGE_REFUSAL.UNCHANGED;

export const changeSubscriptionPlan = async (
  stripe: Stripe,
  subscription: TSubscriptionPlan,
  to: TPlanChoice,
  tenantId: string,
): Promise<TPlanChangeResult> => {
  const { scheduleId } = subscription;
  const timing = planChangeTiming(subscription.current, to);
  if (!timing && !scheduleId) return PLAN_CHANGE_REFUSAL.UNCHANGED;

  const prices =
    timing &&
    (await findTargetPrices(stripe, to, subscription.current.ceiling));
  if (timing && !prices) {
    logger.error(BILLING_LOG.PLAN_CHANGE_PRICE_MISSING, { tenantId, ...to });
    return undefined;
  }

  if (!timing || !prices) {
    if (scheduleId) await releaseSchedule(stripe, scheduleId);
    return PLAN_CHANGE_TIMING.CANCEL_PENDING;
  }

  if (timing === PLAN_CHANGE_TIMING.AT_RENEWAL) {
    await scheduleChangeAtRenewal(stripe, subscription, prices, to.interval);
    return timing;
  }
  return changePlanNow(stripe, subscription, prices, tenantId);
};

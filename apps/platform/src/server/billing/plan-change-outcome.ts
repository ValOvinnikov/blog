import 'server-only';

import { BILLING_LOG } from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  PLAN_CHANGE_TIMING,
  type TPlanChangeRefusal,
  type TPlanChangeRefusalCode,
  type TPlanChangeTiming,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  type TActionResult,
  type TOutcome,
} from '@shinefold/config';
import { isOneOf, isString } from '@shinefold/utils/primitives';
import { toOutcome } from '@shinefold/utils/to-outcome';
import Stripe from 'stripe';

import type { TPlanChangeResult } from './change-subscription-plan';

export type TChangePlanResult =
  | {
      outcome: typeof ACTION_OUTCOME.SUCCESS;
      timing: TPlanChangeTiming;
      clientSecret?: string;
    }
  | Exclude<
      TActionResult<
        typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
        keyof TPlanChoice,
        never,
        TPlanChangeRefusal
      >,
      TOutcome<typeof ACTION_OUTCOME.SUCCESS>
    >;

const isPaymentFailure = (error: unknown): boolean =>
  error instanceof Stripe.errors.StripeError &&
  (error instanceof Stripe.errors.StripeCardError ||
    error.statusCode === HTTP_STATUS.PAYMENT_REQUIRED);

export const refusedPlanChange = (
  reason: TPlanChangeRefusal,
): TChangePlanResult => ({
  outcome: ACTION_OUTCOME.REFUSED,
  reason,
});

type TPlanChangeAttempt = TPlanChangeResult | TPlanChangeRefusalCode;

const toPlanChangeOutcome = (result: TPlanChangeAttempt): TChangePlanResult => {
  if (!result) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  if (!isString(result)) {
    return {
      outcome: ACTION_OUTCOME.SUCCESS,
      timing: PLAN_CHANGE_TIMING.NOW,
      clientSecret: result.clientSecret,
    };
  }
  if (isOneOf(Object.values(PLAN_CHANGE_REFUSAL), result)) {
    return refusedPlanChange(result);
  }
  return { outcome: ACTION_OUTCOME.SUCCESS, timing: result };
};

export const runPlanChange = async (
  tenantId: string,
  change: () => Promise<TPlanChangeAttempt>,
): Promise<TChangePlanResult> => {
  try {
    return toPlanChangeOutcome(await change());
  } catch (error) {
    if (isPaymentFailure(error)) {
      return refusedPlanChange(PLAN_CHANGE_REFUSAL.CARD_DECLINED);
    }
    logger.error(BILLING_LOG.PLAN_CHANGE_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};

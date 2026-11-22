import {
  PLAN_CHANGE_REFUSAL,
  type TPlanChangeRefusal,
} from '@platform/constants/plan-change';
import {
  STRIPE_JS_ERROR_CODE,
  STRIPE_JS_ERROR_TYPE,
} from '@platform/constants/stripe-payment';
import type { TMaybeUndefined } from '@shinefold/config';
import { loadStripe, type StripeError } from '@stripe/stripe-js';

const refusalFor = (
  error: TMaybeUndefined<StripeError>,
): TMaybeUndefined<TPlanChangeRefusal> => {
  if (!error) return undefined;
  return error.type === STRIPE_JS_ERROR_TYPE.CARD_ERROR &&
    error.code !== STRIPE_JS_ERROR_CODE.AUTHENTICATION_FAILURE
    ? PLAN_CHANGE_REFUSAL.CARD_DECLINED
    : PLAN_CHANGE_REFUSAL.PAYMENT_NOT_CONFIRMED;
};

export const confirmPlanPayment = async (
  publishableKey: TMaybeUndefined<string>,
  clientSecret: string,
): Promise<TMaybeUndefined<TPlanChangeRefusal>> => {
  if (!publishableKey) return PLAN_CHANGE_REFUSAL.PAYMENT_NOT_CONFIRMED;
  try {
    const stripe = await loadStripe(publishableKey);
    if (!stripe) return PLAN_CHANGE_REFUSAL.PAYMENT_NOT_CONFIRMED;
    const { error } = await stripe.handleNextAction({ clientSecret });
    return refusalFor(error);
  } catch {
    return PLAN_CHANGE_REFUSAL.PAYMENT_NOT_CONFIRMED;
  }
};

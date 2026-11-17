import {
  PLAN_CHANGE_REFUSAL,
  type TPlanChangeRefusal,
} from '@platform/constants/plan-change';
import {
  STRIPE_JS_ERROR_CODE,
  STRIPE_JS_ERROR_TYPE,
} from '@platform/constants/stripe-payment';
import type { TMaybeUndefined } from '@shinefold/config';
import { loadStripe } from '@stripe/stripe-js';

export const confirmPlanPayment = async (
  publishableKey: TMaybeUndefined<string>,
  clientSecret: string,
): Promise<TMaybeUndefined<TPlanChangeRefusal>> => {
  const stripe = publishableKey && (await loadStripe(publishableKey));
  if (!stripe) return PLAN_CHANGE_REFUSAL.PAYMENT_NOT_CONFIRMED;
  const { error } = await stripe.handleNextAction({ clientSecret });
  if (!error) return undefined;
  return error.type === STRIPE_JS_ERROR_TYPE.CARD_ERROR &&
    error.code !== STRIPE_JS_ERROR_CODE.AUTHENTICATION_FAILURE
    ? PLAN_CHANGE_REFUSAL.CARD_DECLINED
    : PLAN_CHANGE_REFUSAL.PAYMENT_NOT_CONFIRMED;
};

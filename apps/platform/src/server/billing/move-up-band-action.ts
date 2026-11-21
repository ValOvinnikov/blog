'use server';

import { MOVE_UP_QUOTE_MAX_AGE_SECONDS } from '@platform/constants/billing';
import { PLAN_CHANGE_REFUSAL } from '@platform/constants/plan-change';

import { changePlanNow } from './change-plan-now';
import { moveUpBandSchema, type TMoveUpBandInput } from './move-up-band-input';
import { runPlanChange, type TChangePlanResult } from './plan-change-outcome';
import { readChangeRequest } from './read-change-request';
import { resolveMoveUpPrices } from './resolve-move-up-prices';
import { toStripeTime } from './stripe-time';

const isFreshQuote = (prorationDate: number): boolean => {
  const age = toStripeTime(new Date()) - prorationDate;
  return age >= 0 && age <= MOVE_UP_QUOTE_MAX_AGE_SECONDS;
};

export const moveUpSubscriberBandAction = async (
  tenantId: string,
  input: TMoveUpBandInput,
): Promise<TChangePlanResult> => {
  const request = await readChangeRequest(tenantId, moveUpBandSchema, input);
  if (!request.ok) return request.error;
  const { stripe, subscription, input: band } = request.data;
  const { ceiling, prorationDate } = band;

  return runPlanChange(tenantId, async () => {
    if (!isFreshQuote(prorationDate)) return PLAN_CHANGE_REFUSAL.QUOTE_EXPIRED;
    const prices = await resolveMoveUpPrices(tenantId, request.data, ceiling);
    if (!prices.ok) return prices.error;
    return changePlanNow(
      stripe,
      subscription,
      prices.data,
      tenantId,
      prorationDate,
    );
  });
};

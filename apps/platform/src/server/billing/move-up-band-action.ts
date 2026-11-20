'use server';

import { changePlanNow } from './change-plan-now';
import { moveUpBandSchema, type TMoveUpBandInput } from './move-up-band-input';
import { runPlanChange, type TChangePlanResult } from './plan-change-outcome';
import { readChangeRequest } from './read-change-request';
import { resolveMoveUpPrices } from './resolve-move-up-prices';

export const moveUpSubscriberBandAction = async (
  tenantId: string,
  input: TMoveUpBandInput,
): Promise<TChangePlanResult> => {
  const request = await readChangeRequest(tenantId, moveUpBandSchema, input);
  if (!request.ok) return request.error;
  const { stripe, subscription, input: band } = request.data;

  return runPlanChange(tenantId, async () => {
    const prices = await resolveMoveUpPrices(
      tenantId,
      request.data,
      band.ceiling,
    );
    if (!prices.ok) return prices.error;
    return changePlanNow(stripe, subscription, prices.data, tenantId);
  });
};

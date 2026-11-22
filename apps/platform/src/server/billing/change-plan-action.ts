'use server';

import type { TPlanChoice } from '@platform/constants/plan-change';

import { changeSubscriptionPlan } from './change-subscription-plan';
import { runPlanChange, type TChangePlanResult } from './plan-change-outcome';
import { readChangeRequest } from './read-change-request';
import { planChoiceSchema } from './upgrade-checkout-input';

export const changePlanAction = async (
  tenantId: string,
  input: TPlanChoice,
): Promise<TChangePlanResult> => {
  const request = await readChangeRequest(tenantId, planChoiceSchema, input);
  if (!request.ok) return request.error;
  const { stripe, subscription, input: choice } = request.data;

  return runPlanChange(tenantId, () =>
    changeSubscriptionPlan(stripe, subscription, choice, tenantId),
  );
};

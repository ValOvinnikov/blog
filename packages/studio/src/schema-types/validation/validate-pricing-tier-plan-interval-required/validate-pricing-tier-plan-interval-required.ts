import type { TMaybeUndefined } from '@blog/config/types';
import type { ValidationContext } from 'sanity';

const PLAN_INTERVAL_REQUIRED_MESSAGE =
  'Choose which of the plan’s prices the tier shows.';

type TPricingTierParent = { platformPlan?: string };

export const validatePricingTierPlanIntervalRequired = (
  interval: unknown,
  context: ValidationContext,
): string | true => {
  const parent = context.parent as TMaybeUndefined<TPricingTierParent>;

  return parent?.platformPlan && !interval
    ? PLAN_INTERVAL_REQUIRED_MESSAGE
    : true;
};

import { isPricingTierLinked } from '@blog/studio/schema-types/validation/is-pricing-tier-linked/is-pricing-tier-linked';
import type { ValidationContext } from 'sanity';

const PLAN_INTERVAL_REQUIRED_MESSAGE =
  'Choose which of the plan’s prices the tier shows.';

export const validatePricingTierPlanIntervalRequired = (
  interval: unknown,
  context: ValidationContext,
): string | true => {
  return isPricingTierLinked(context.parent) && !interval
    ? PLAN_INTERVAL_REQUIRED_MESSAGE
    : true;
};

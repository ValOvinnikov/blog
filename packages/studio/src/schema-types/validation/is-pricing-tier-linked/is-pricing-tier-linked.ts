import type { TSellableTenantPlan } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';

type TLinkedPricingTier = { platformPlan?: TSellableTenantPlan };

export const isPricingTierLinked = (tier: unknown) =>
  Boolean((tier as TMaybeUndefined<TLinkedPricingTier>)?.platformPlan);

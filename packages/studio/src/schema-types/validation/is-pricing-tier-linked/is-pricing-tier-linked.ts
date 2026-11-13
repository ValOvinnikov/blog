import type { TSellableTenantPlan } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';

type TLinkedPricingTier = { platformPlan?: TSellableTenantPlan };

export const isPricingTierLinked = (tier: unknown) =>
  Boolean((tier as TMaybeUndefined<TLinkedPricingTier>)?.platformPlan);

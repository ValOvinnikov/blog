import { TENANT_PLAN } from '@blog/config/constants';
import { isPricingTierLinked } from '@blog/studio/schema-types/validation/is-pricing-tier-linked/is-pricing-tier-linked';

describe(isPricingTierLinked, () => {
  it.each([
    [
      'links a tier with a platform plan',
      { platformPlan: TENANT_PLAN.STARTER },
      true,
    ],
    ['leaves a tier without a platform plan unlinked', {}, false],
    ['leaves a missing tier unlinked', undefined, false],
  ])('%s', (_description, tier, expected) => {
    expect(isPricingTierLinked(tier)).toBe(expected);
  });
});

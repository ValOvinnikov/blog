import { PRICE_PERIOD, TENANT_PLAN } from '@blog/config/constants';
import { validatePricingTierPlanIntervalRequired } from '@blog/studio/schema-types/validation/validate-pricing-tier-plan-interval-required/validate-pricing-tier-plan-interval-required';
import { mockValidationContext } from '@blog/studio/testing/mock-validation-context';

const PLAN_INTERVAL_REQUIRED_MESSAGE =
  'Choose which of the plan’s prices the tier shows.';

describe(validatePricingTierPlanIntervalRequired, () => {
  it.each([
    [
      'passes a linked tier with an interval',
      { platformPlan: TENANT_PLAN.GROWTH },
      PRICE_PERIOD.YEAR,
      true,
    ],
    [
      'fails a linked tier without an interval',
      { platformPlan: TENANT_PLAN.GROWTH },
      undefined,
      PLAN_INTERVAL_REQUIRED_MESSAGE,
    ],
    ['passes an unlinked tier without an interval', {}, undefined, true],
  ])('%s', (_description, parent, interval, expected) => {
    expect(
      validatePricingTierPlanIntervalRequired(
        interval,
        mockValidationContext({ parent }),
      ),
    ).toBe(expected);
  });
});

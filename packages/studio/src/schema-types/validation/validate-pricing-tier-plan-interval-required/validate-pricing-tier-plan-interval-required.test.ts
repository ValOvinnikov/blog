import { PRICE_PERIOD, TENANT_PLAN } from '@blog/config/constants';
import { validatePricingTierPlanIntervalRequired } from '@blog/studio/schema-types/validation/validate-pricing-tier-plan-interval-required/validate-pricing-tier-plan-interval-required';
import { mockValidationContext } from '@blog/studio/testing/mock-validation-context';

const PLAN_INTERVAL_REQUIRED_MESSAGE =
  'Choose which of the plan’s prices the tier shows.';

const MOCK_LINKED_PARENT = { platformPlan: TENANT_PLAN.GROWTH };

describe(validatePricingTierPlanIntervalRequired, () => {
  it.each([
    [
      'passes a linked tier with an interval',
      MOCK_LINKED_PARENT,
      PRICE_PERIOD.YEAR,
      true,
    ],
    [
      'fails a linked tier without an interval',
      MOCK_LINKED_PARENT,
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

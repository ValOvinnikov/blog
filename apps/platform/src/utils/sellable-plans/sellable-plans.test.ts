import { TENANT_PLAN } from '@blog/db/constants';

import { isSellablePlan } from './sellable-plans';

describe(isSellablePlan, () => {
  it.each([
    [TENANT_PLAN.FREE, false],
    [TENANT_PLAN.STARTER, true],
    [TENANT_PLAN.GROWTH, true],
  ])('sells %s: %s', (plan, expected) => {
    expect(isSellablePlan(plan)).toBe(expected);
  });
});

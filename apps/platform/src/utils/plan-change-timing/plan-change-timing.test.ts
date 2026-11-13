import { TENANT_PLAN } from '@blog/config/constants';
import { BILLING_INTERVAL } from '@platform/constants/billing';
import {
  PLAN_CHANGE_TIMING,
  type TPlanChoice,
} from '@platform/constants/plan-change';

import { isSamePlanChoice, planChangeTiming } from './plan-change-timing';

const STARTER_MONTHLY: TPlanChoice = {
  plan: TENANT_PLAN.STARTER,
  interval: BILLING_INTERVAL.MONTHLY,
};
const STARTER_YEARLY: TPlanChoice = {
  plan: TENANT_PLAN.STARTER,
  interval: BILLING_INTERVAL.YEARLY,
};
const GROWTH_MONTHLY: TPlanChoice = {
  plan: TENANT_PLAN.GROWTH,
  interval: BILLING_INTERVAL.MONTHLY,
};
const GROWTH_YEARLY: TPlanChoice = {
  plan: TENANT_PLAN.GROWTH,
  interval: BILLING_INTERVAL.YEARLY,
};

describe(planChangeTiming, () => {
  it.each([
    ['Starter to Growth', STARTER_MONTHLY, GROWTH_MONTHLY],
    ['monthly to yearly', STARTER_MONTHLY, STARTER_YEARLY],
    ['Starter yearly to Growth monthly', STARTER_YEARLY, GROWTH_MONTHLY],
  ])('moves %s now', (_case, from, to) => {
    expect(planChangeTiming(from, to)).toBe(PLAN_CHANGE_TIMING.NOW);
  });

  it.each([
    ['Growth to Starter', GROWTH_MONTHLY, STARTER_MONTHLY],
    ['yearly to monthly', GROWTH_YEARLY, GROWTH_MONTHLY],
    ['Growth monthly to Starter yearly', GROWTH_MONTHLY, STARTER_YEARLY],
  ])('moves %s at renewal', (_case, from, to) => {
    expect(planChangeTiming(from, to)).toBe(PLAN_CHANGE_TIMING.AT_RENEWAL);
  });

  it('has nothing to change for the same plan and period', () => {
    expect(planChangeTiming(GROWTH_YEARLY, GROWTH_YEARLY)).toBeUndefined();
  });
});

describe(isSamePlanChoice, () => {
  it('matches only the same plan and period', () => {
    expect(isSamePlanChoice(GROWTH_YEARLY, { ...GROWTH_YEARLY })).toBe(true);
    expect(isSamePlanChoice(GROWTH_YEARLY, GROWTH_MONTHLY)).toBe(false);
  });
});

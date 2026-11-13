import { PLAN_CHANGE_TIMING } from '@platform/constants/plan-change';
import {
  MOCK_GROWTH_MONTHLY_CHOICE,
  MOCK_GROWTH_YEARLY_CHOICE,
  MOCK_STARTER_MONTHLY_CHOICE,
  MOCK_STARTER_YEARLY_CHOICE,
} from '@platform/testing/billing/plan-choices';

import { isSamePlanChoice, planChangeTiming } from './plan-change-timing';

describe(planChangeTiming, () => {
  it.each([
    [
      'Starter to Growth',
      MOCK_STARTER_MONTHLY_CHOICE,
      MOCK_GROWTH_MONTHLY_CHOICE,
    ],
    [
      'monthly to yearly',
      MOCK_STARTER_MONTHLY_CHOICE,
      MOCK_STARTER_YEARLY_CHOICE,
    ],
  ])('moves %s now', (_case, from, to) => {
    expect(planChangeTiming(from, to)).toBe(PLAN_CHANGE_TIMING.NOW);
  });

  it.each([
    [
      'Growth to Starter',
      MOCK_GROWTH_MONTHLY_CHOICE,
      MOCK_STARTER_MONTHLY_CHOICE,
    ],
    [
      'yearly to monthly',
      MOCK_GROWTH_YEARLY_CHOICE,
      MOCK_GROWTH_MONTHLY_CHOICE,
    ],
    [
      'Growth monthly to Starter yearly',
      MOCK_GROWTH_MONTHLY_CHOICE,
      MOCK_STARTER_YEARLY_CHOICE,
    ],
    [
      'Starter yearly to Growth monthly',
      MOCK_STARTER_YEARLY_CHOICE,
      MOCK_GROWTH_MONTHLY_CHOICE,
    ],
  ])('moves %s at renewal', (_case, from, to) => {
    expect(planChangeTiming(from, to)).toBe(PLAN_CHANGE_TIMING.AT_RENEWAL);
  });

  it('has nothing to change for the same plan and period', () => {
    expect(
      planChangeTiming(MOCK_GROWTH_YEARLY_CHOICE, MOCK_GROWTH_YEARLY_CHOICE),
    ).toBeUndefined();
  });
});

describe(isSamePlanChoice, () => {
  it('matches only the same plan and period', () => {
    expect(
      isSamePlanChoice(MOCK_GROWTH_YEARLY_CHOICE, {
        ...MOCK_GROWTH_YEARLY_CHOICE,
      }),
    ).toBe(true);
    expect(
      isSamePlanChoice(MOCK_GROWTH_YEARLY_CHOICE, MOCK_GROWTH_MONTHLY_CHOICE),
    ).toBe(false);
  });
});

import { TENANT_PLAN } from '@blog/config/constants';

import { monthlySendAllowance } from './monthly-send-allowance';

describe(monthlySendAllowance, () => {
  it.each([TENANT_PLAN.FREE, TENANT_PLAN.STARTER])(
    'allows a %s site no sends',
    (plan) => {
      expect(monthlySendAllowance(plan, 500)).toBe(0);
    },
  );

  it.each([
    [0, 6_000],
    [1_000, 6_000],
    [1_001, 15_000],
    [2_500, 15_000],
    [2_501, 30_000],
    [5_000, 30_000],
    [10_000, 60_000],
    [25_000, 150_000],
    [30_000, 180_000],
  ])(
    'allows a Growth site with %i subscribers %i sends',
    (subscribers, allowance) => {
      expect(monthlySendAllowance(TENANT_PLAN.GROWTH, subscribers)).toBe(
        allowance,
      );
    },
  );
});

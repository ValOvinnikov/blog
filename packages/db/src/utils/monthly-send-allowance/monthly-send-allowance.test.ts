import { TENANT_PLAN } from '@shinefold/config/constants';
import type { TSubscriberBandCeiling } from '@shinefold/db/constants';

import { monthlySendAllowance } from './monthly-send-allowance';

describe(monthlySendAllowance, () => {
  it.each([TENANT_PLAN.FREE, TENANT_PLAN.STARTER])(
    'allows a %s site no sends',
    (plan) => {
      expect(monthlySendAllowance(plan, 1_000)).toBe(0);
    },
  );

  it.each<[TSubscriberBandCeiling, number]>([
    [1_000, 6_000],
    [2_500, 15_000],
    [5_000, 30_000],
    [10_000, 60_000],
    [25_000, 150_000],
  ])(
    'allows a Growth site on the %i band %i sends',
    (bandCeiling, allowance) => {
      expect(monthlySendAllowance(TENANT_PLAN.GROWTH, bandCeiling)).toBe(
        allowance,
      );
    },
  );
});

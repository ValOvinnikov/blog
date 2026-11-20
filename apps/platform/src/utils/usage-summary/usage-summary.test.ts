import { USAGE_LEVEL } from '@platform/constants/usage';

import { toUsageSummary } from './usage-summary';

describe(toUsageSummary.name, () => {
  it('reads nothing used as the under-limit state with the whole allowance left', () => {
    expect(toUsageSummary({ used: 0, allowance: 20 })).toEqual({
      level: USAGE_LEVEL.UNDER,
      shown: 0,
      percent: 0,
      left: 20,
    });
  });

  it('stays under the limit just below the near threshold', () => {
    expect(toUsageSummary({ used: 79, allowance: 100 }).level).toBe(
      USAGE_LEVEL.UNDER,
    );
  });

  it('reaches the near state at the threshold', () => {
    expect(toUsageSummary({ used: 16, allowance: 20 })).toEqual({
      level: USAGE_LEVEL.NEAR,
      shown: 16,
      percent: 80,
      left: 4,
    });
  });

  it('rounds the percentage down so an almost-full allowance is not used up', () => {
    expect(toUsageSummary({ used: 249, allowance: 250 })).toEqual({
      level: USAGE_LEVEL.NEAR,
      shown: 249,
      percent: 99,
      left: 1,
    });
  });

  it('reads a full allowance as used up', () => {
    expect(toUsageSummary({ used: 3, allowance: 3 }).level).toBe(
      USAGE_LEVEL.FULL,
    );
  });

  it('caps use above the allowance at the allowance', () => {
    expect(toUsageSummary({ used: 4, allowance: 3 })).toEqual({
      level: USAGE_LEVEL.FULL,
      shown: 3,
      percent: 100,
      left: 0,
    });
  });
});

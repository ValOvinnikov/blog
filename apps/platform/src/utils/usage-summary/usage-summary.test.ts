import { USAGE_LEVEL } from '@platform/constants/usage';
import { MOCK_USAGE_ALLOWANCE } from '@platform/testing/usage/fixtures';

import { toUsageSummary } from './usage-summary';

const MOCK_NEAR_ALLOWANCE = 250;

describe(toUsageSummary.name, () => {
  it.each([
    [
      'reads nothing used as under the limit',
      { used: 0, allowance: MOCK_USAGE_ALLOWANCE },
      { level: USAGE_LEVEL.UNDER, shown: 0, percent: 0, left: 20 },
    ],
    [
      'stays under the limit just below the near threshold',
      { used: 15, allowance: MOCK_USAGE_ALLOWANCE },
      { level: USAGE_LEVEL.UNDER, shown: 15, percent: 75, left: 5 },
    ],
    [
      'reaches the near state at the threshold',
      { used: 16, allowance: MOCK_USAGE_ALLOWANCE },
      { level: USAGE_LEVEL.NEAR, shown: 16, percent: 80, left: 4 },
    ],
    [
      'rounds the percentage down so an almost-full allowance is not used up',
      { used: 249, allowance: MOCK_NEAR_ALLOWANCE },
      { level: USAGE_LEVEL.NEAR, shown: 249, percent: 99, left: 1 },
    ],
    [
      'reads a full allowance as used up',
      { used: MOCK_USAGE_ALLOWANCE, allowance: MOCK_USAGE_ALLOWANCE },
      { level: USAGE_LEVEL.FULL, shown: 20, percent: 100, left: 0 },
    ],
    [
      'caps use above the allowance at the allowance',
      { used: 23, allowance: MOCK_USAGE_ALLOWANCE },
      { level: USAGE_LEVEL.FULL, shown: 20, percent: 100, left: 0 },
    ],
  ])('%s', (_, reading, summary) => {
    expect(toUsageSummary(reading)).toEqual(summary);
  });
});

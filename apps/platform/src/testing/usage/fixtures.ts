import { USAGE_METER } from '@platform/constants/usage';
import type { TUsageMeterRow } from '@platform/server/usage/load-usage-meters';

export const MOCK_USAGE_NOW = new Date('2026-11-20T12:00:00.000Z');
export const MOCK_USAGE_RESETS_ON = 'December 1';

export const mockUsageMeterRow = (
  overrides: Partial<TUsageMeterRow> = {},
): TUsageMeterRow => ({
  meter: USAGE_METER.TAKEAWAYS,
  reading: { used: 2, allowance: 20 },
  isMonthly: true,
  href: undefined,
  grant: undefined,
  ...overrides,
});

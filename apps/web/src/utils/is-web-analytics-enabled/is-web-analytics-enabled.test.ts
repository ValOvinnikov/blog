import type { TMaybeUndefined } from '@blog/config';

import { isWebAnalyticsEnabled } from './is-web-analytics-enabled';

const mockEnv = vi.hoisted(() => ({
  WEB_ANALYTICS_ENABLED: undefined as TMaybeUndefined<string>,
}));

vi.mock('@web/utils/env/env', () => ({ env: mockEnv }));

describe(isWebAnalyticsEnabled, () => {
  it.each([
    { value: 'true', expected: true },
    { value: 'false', expected: false },
    { value: undefined, expected: false },
  ])(
    'is $expected when WEB_ANALYTICS_ENABLED is $value',
    ({ value, expected }) => {
      mockEnv.WEB_ANALYTICS_ENABLED = value;

      expect(isWebAnalyticsEnabled()).toBe(expected);
    },
  );
});

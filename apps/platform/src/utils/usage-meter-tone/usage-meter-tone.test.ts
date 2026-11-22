import { METER_TONE } from '@platform/constants/meter';
import { USAGE_LEVEL } from '@platform/constants/usage';

import { usageMeterTone } from './usage-meter-tone';

describe(usageMeterTone, () => {
  it.each([
    [USAGE_LEVEL.UNDER, false, false, METER_TONE.BRAND],
    [USAGE_LEVEL.NEAR, true, false, METER_TONE.WARN],
    [USAGE_LEVEL.FULL, false, false, METER_TONE.WARN],
    [USAGE_LEVEL.FULL, true, false, METER_TONE.BAD],
    [USAGE_LEVEL.UNDER, true, true, METER_TONE.BAD],
  ])(
    'fills a %s meter (monthly %s, paused %s) in %s',
    (level, isMonthly, isPaused, tone) => {
      expect(usageMeterTone({ level, isMonthly, isPaused })).toBe(tone);
    },
  );
});

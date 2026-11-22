import { METER_TONE, type TMeterTone } from '@platform/constants/meter';
import { USAGE_LEVEL, type TUsageLevel } from '@platform/constants/usage';

export type TUsageMeterToneInput = {
  level: TUsageLevel;
  isMonthly: boolean;
  isPaused: boolean;
};

export const usageMeterTone = ({
  level,
  isMonthly,
  isPaused,
}: TUsageMeterToneInput): TMeterTone => {
  if (isPaused || (level === USAGE_LEVEL.FULL && isMonthly)) {
    return METER_TONE.BAD;
  }
  return level === USAGE_LEVEL.UNDER ? METER_TONE.BRAND : METER_TONE.WARN;
};

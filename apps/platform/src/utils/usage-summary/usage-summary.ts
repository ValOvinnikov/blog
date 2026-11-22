import {
  USAGE_LEVEL,
  USAGE_NEAR_PERCENT,
  type TUsageLevel,
} from '@platform/constants/usage';

const FULL_PERCENT = 100;

export type TUsageReading = {
  used: number;
  allowance: number;
};

export type TUsageSummary = {
  level: TUsageLevel;
  shown: number;
  percent: number;
  left: number;
};

/** Used above the allowance reads as the allowance, and the percentage rounds down so only a full allowance reads as used up. */
export const toUsageSummary = ({
  used,
  allowance,
}: TUsageReading): TUsageSummary => {
  const shown = Math.min(used, allowance);
  const left = allowance - shown;
  const percent =
    allowance > 0
      ? Math.floor((shown * FULL_PERCENT) / allowance)
      : FULL_PERCENT;
  const level =
    left <= 0
      ? USAGE_LEVEL.FULL
      : percent >= USAGE_NEAR_PERCENT
        ? USAGE_LEVEL.NEAR
        : USAGE_LEVEL.UNDER;

  return { level, shown, percent, left };
};

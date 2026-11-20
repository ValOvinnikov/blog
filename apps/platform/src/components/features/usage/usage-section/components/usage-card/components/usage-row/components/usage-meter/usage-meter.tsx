'use client';

import { Meter } from '@base-ui/react/meter';
import type { TUsageLevel } from '@platform/constants/usage';
import { LOCALE_BCP47_TAGS } from '@shinefold/config';
import { useLocale } from 'next-intl';

import { usageMeterVariants } from './usage-meter-variants';

export type TUsageMeterProps = {
  value: number;
  max: number;
  labelledBy: string;
  level: TUsageLevel;
  isMonthly: boolean;
};

export const UsageMeter = ({
  value,
  max,
  labelledBy,
  level,
  isMonthly,
}: TUsageMeterProps) => {
  const locale = useLocale();
  const { root, track, indicator } = usageMeterVariants({ level, isMonthly });

  return (
    <Meter.Root
      value={value}
      min={0}
      max={max}
      locale={LOCALE_BCP47_TAGS[locale]}
      aria-labelledby={labelledBy}
      className={root()}
    >
      <Meter.Track className={track()}>
        <Meter.Indicator className={indicator()} />
      </Meter.Track>
    </Meter.Root>
  );
};

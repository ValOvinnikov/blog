'use client';

import { Meter } from '@base-ui/react/meter';
import type { TMeterTone } from '@platform/constants/meter';
import { LOCALE_BCP47_TAGS, type TNamedControlAria } from '@shinefold/config';
import { useLocale } from 'next-intl';

import { usageMeterVariants } from './usage-meter-variants';

export type TUsageMeterProps = {
  value: number;
  max: number;
  aria: TNamedControlAria;
  tone: TMeterTone;
};

export const UsageMeter = ({ value, max, aria, tone }: TUsageMeterProps) => {
  const locale = useLocale();
  const { label, labelledBy, describedBy } = aria;
  const { root, track, indicator } = usageMeterVariants({
    tone,
    isFull: value >= max,
  });

  return (
    <Meter.Root
      value={Math.min(value, max)}
      min={0}
      max={max}
      locale={LOCALE_BCP47_TAGS[locale]}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={root()}
    >
      <Meter.Track className={track()}>
        <Meter.Indicator className={indicator()} />
      </Meter.Track>
    </Meter.Root>
  );
};

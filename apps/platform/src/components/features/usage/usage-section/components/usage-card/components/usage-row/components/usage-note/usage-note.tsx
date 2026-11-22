import type { TUsageMeter } from '@platform/constants/usage';
import type { TUsageSummary } from '@platform/utils/usage-summary/usage-summary';
import type { TMaybeUndefined } from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

import { usageNoteVariants } from './usage-note-variants';

export type TUsageNoteProps = {
  meter: TUsageMeter;
  summary: TUsageSummary;
  isMonthly: boolean;
  resetsOn: string;
  pausedPostNeeds: TMaybeUndefined<number>;
};

export const UsageNote = ({
  meter,
  summary,
  isMonthly,
  resetsOn,
  pausedPostNeeds,
}: TUsageNoteProps) => {
  const t = useTranslations('usageCard.notes');
  const { level, percent, left } = summary;
  const isPaused = !isUndefined(pausedPostNeeds);
  const { root, separator, reset } = usageNoteVariants({
    level,
    isMonthly,
    isPaused,
  });

  if (isPaused) {
    return (
      <p className={root()}>
        {t('paused', { count: pausedPostNeeds, date: resetsOn })}
      </p>
    );
  }

  return (
    <p className={root()}>
      {t.rich(`${meter}.${level}`, {
        percent,
        left,
        date: resetsOn,
        separator: (chunks) => <span className={separator()}>{chunks}</span>,
        reset: (chunks) => <span className={reset()}>{chunks}</span>,
      })}
    </p>
  );
};

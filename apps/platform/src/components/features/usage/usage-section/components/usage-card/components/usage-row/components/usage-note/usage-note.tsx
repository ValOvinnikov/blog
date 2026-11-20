import type { TUsageMeter } from '@platform/constants/usage';
import type { TUsageSummary } from '@platform/utils/usage-summary/usage-summary';
import { useTranslations } from 'next-intl';

import { usageNoteVariants } from './usage-note-variants';

export type TUsageNoteProps = {
  meter: TUsageMeter;
  summary: TUsageSummary;
  isMonthly: boolean;
  resetsOn: string;
};

export const UsageNote = ({
  meter,
  summary,
  isMonthly,
  resetsOn,
}: TUsageNoteProps) => {
  const t = useTranslations('usageCard.notes');
  const { level, percent, left } = summary;
  const { root, separator, reset } = usageNoteVariants({ level, isMonthly });

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

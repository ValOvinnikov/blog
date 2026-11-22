import { GrantedBadge } from '@platform/components/features/entitlement-grants/granted-badge';
import { TextLink } from '@platform/components/shared/text-link';
import { UsageMeter } from '@platform/components/shared/usage-meter';
import type { TUsageMeterRow } from '@platform/server/usage/load-usage-meters';
import { usageMeterTone } from '@platform/utils/usage-meter-tone/usage-meter-tone';
import { toUsageSummary } from '@platform/utils/usage-summary/usage-summary';
import { isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { UsageFailed } from './components/usage-failed/usage-failed';
import { UsageNote } from './components/usage-note/usage-note';
import { usageRowVariants } from './usage-row-variants';

export type TUsageRowProps = {
  row: TUsageMeterRow;
  resetsOn: string;
};

export const UsageRow = ({ row, resetsOn }: TUsageRowProps) => {
  const t = useTranslations('usageCard');
  const labelId = useId();
  const { meter, reading, pausedPostNeeds, isMonthly, href, grant } = row;
  const summary = reading && toUsageSummary(reading);
  const isPaused = !isUndefined(pausedPostNeeds);
  const { root, top, label, link, value, count } = usageRowVariants({
    level: summary?.level,
    isMonthly,
    isPaused,
  });

  return (
    <div className={root()}>
      <div className={top()}>
        <span id={labelId} className={label()}>
          {t(`labels.${meter}`)}
        </span>
        {grant && <GrantedBadge expiresAt={grant.expiresAt} />}
        {href && (
          <span className={link()}>
            <TextLink href={href}>{t(`links.${meter}`)}</TextLink>
          </span>
        )}
      </div>
      {reading && summary ? (
        <>
          <p className={value()}>
            {t.rich('value', {
              used: summary.shown,
              allowance: reading.allowance,
              count: (chunks) => <span className={count()}>{chunks}</span>,
            })}
          </p>
          <UsageMeter
            value={summary.shown}
            max={reading.allowance}
            aria={{ labelledBy: labelId }}
            tone={usageMeterTone({
              level: summary.level,
              isMonthly,
              isPaused,
            })}
          />
          <UsageNote
            meter={meter}
            summary={summary}
            isMonthly={isMonthly}
            resetsOn={resetsOn}
            pausedPostNeeds={pausedPostNeeds}
          />
        </>
      ) : (
        <UsageFailed />
      )}
    </div>
  );
};

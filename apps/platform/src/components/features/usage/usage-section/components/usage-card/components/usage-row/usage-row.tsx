import { GrantedBadge } from '@platform/components/features/entitlement-grants/granted-badge';
import { TextLink } from '@platform/components/shared/text-link';
import type { TUsageMeterRow } from '@platform/server/usage/load-usage-meters';
import { toUsageSummary } from '@platform/utils/usage-summary/usage-summary';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { UsageFailed } from './components/usage-failed/usage-failed';
import { UsageMeter } from './components/usage-meter/usage-meter';
import { UsageNote } from './components/usage-note/usage-note';
import { usageRowVariants } from './usage-row-variants';

export type TUsageRowProps = {
  row: TUsageMeterRow;
  resetsOn: string;
};

export const UsageRow = ({ row, resetsOn }: TUsageRowProps) => {
  const t = useTranslations('usageCard');
  const labelId = useId();
  const { meter, reading, isMonthly, href, grant } = row;
  const summary = reading && toUsageSummary(reading);
  const { root, top, label, link, value, count } = usageRowVariants({
    level: summary?.level,
    isMonthly,
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
            labelledBy={labelId}
            level={summary.level}
            isMonthly={isMonthly}
          />
          <UsageNote
            meter={meter}
            summary={summary}
            isMonthly={isMonthly}
            resetsOn={resetsOn}
          />
        </>
      ) : (
        <UsageFailed />
      )}
    </div>
  );
};

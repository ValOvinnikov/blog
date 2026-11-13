import type { TMaybeUndefined } from '@blog/config';
import { Text } from '@platform/components/shared/text';
import {
  PLAN_CHANGE_TIMING,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import type { TPendingPlanChange } from '@platform/server/billing/load-subscription-plan';
import { formatDate } from '@platform/utils/format-date/format-date';
import { planChangeTiming } from '@platform/utils/plan-change-timing/plan-change-timing';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export type TPlanChangeSummaryProps = {
  current: TPlanChoice;
  choice: TPlanChoice;
  renewsAt: Date;
  pending: TMaybeUndefined<TPendingPlanChange>;
};

export const PlanChangeSummary = ({
  current,
  choice,
  renewsAt,
  pending,
}: TPlanChangeSummaryProps) => {
  const t = useTranslations('upgradePage');
  const tPlan = useTranslations('planNames');
  const locale = useLocale();
  const timing = planChangeTiming(current, choice);
  const dated = (date: Date) => ({
    date: formatDate(date, locale),
    time: (chunks: ReactNode) => (
      <time dateTime={date.toISOString()}>{chunks}</time>
    ),
  });

  if (timing === PLAN_CHANGE_TIMING.NOW) return <Text>{t('changeNow')}</Text>;
  if (timing === PLAN_CHANGE_TIMING.AT_RENEWAL) {
    return <Text>{t.rich('changeAtRenewal', dated(renewsAt))}</Text>;
  }
  if (pending) {
    return (
      <Text>
        {t.rich('keepCurrentDescription', {
          plan: tPlan(current.plan),
          ...dated(pending.startsAt),
        })}
      </Text>
    );
  }
  return <Text>{t('changeUnchanged')}</Text>;
};

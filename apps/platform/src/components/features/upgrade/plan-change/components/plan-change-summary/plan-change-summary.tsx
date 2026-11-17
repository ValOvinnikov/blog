import { Text } from '@platform/components/shared/text';
import {
  PLAN_CHANGE_TIMING,
  type TPlanChoice,
} from '@platform/constants/plan-change';
import type { TPendingPlanChange } from '@platform/server/billing/load-subscription-plan';
import { planChangeTiming } from '@platform/utils/plan-change-timing/plan-change-timing';
import { richDate } from '@platform/utils/rich-date/rich-date';
import type { TMaybeUndefined } from '@shinefold/config';
import { useLocale, useTranslations } from 'next-intl';

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

  if (timing === PLAN_CHANGE_TIMING.NOW) {
    return (
      <Text>
        {choice.interval === current.interval
          ? t('changeNow')
          : t('changeNowNewPeriod', { interval: choice.interval })}
      </Text>
    );
  }
  if (timing === PLAN_CHANGE_TIMING.AT_RENEWAL) {
    return <Text>{t.rich('changeAtRenewal', richDate(renewsAt, locale))}</Text>;
  }
  if (pending) {
    return (
      <Text>
        {t.rich('keepCurrentDescription', {
          plan: tPlan(current.plan),
          ...richDate(pending.startsAt, locale),
        })}
      </Text>
    );
  }
  return <Text>{t('changeUnchanged')}</Text>;
};

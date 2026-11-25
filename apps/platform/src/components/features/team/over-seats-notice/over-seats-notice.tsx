import { Alert } from '@platform/components/shared/alert';
import { richDate } from '@platform/utils/rich-date/rich-date';
import type { TTeamViewModel } from '@platform/utils/team-view-model/team-view-model';
import { ALERT_TYPE } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { useLocale, useTranslations } from 'next-intl';

export type TOverSeatsNoticeProps = {
  plan: TTenantPlan;
  team: Pick<TTeamViewModel, 'seats' | 'seatsOver' | 'graceEndsAt'>;
};

export const OverSeatsNotice = ({
  plan,
  team: { seats, seatsOver, graceEndsAt },
}: TOverSeatsNoticeProps) => {
  const t = useTranslations('teamPage');
  const tPlan = useTranslations('planNames');
  const locale = useLocale();
  const planName = tPlan(plan);

  return (
    <Alert
      type={ALERT_TYPE.WARNING}
      title={t('overSeatsTitle', { count: seatsOver, plan: planName })}
      description={
        <>
          <p>{t('overSeatsBody', { plan: planName, seats })}</p>
          {graceEndsAt && (
            <p>{t.rich('overSeatsDeadline', richDate(graceEndsAt, locale))}</p>
          )}
        </>
      }
    />
  );
};

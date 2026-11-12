import { ALERT_TYPE } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { Alert } from '@platform/components/shared/alert';
import { formatDate } from '@platform/utils/format-date/format-date';
import { useLocale, useTranslations } from 'next-intl';

export type TTrialNoticeProps = {
  plan: TTenantPlan;
  trialEndsAt: Date;
};

export const TrialNotice = ({ plan, trialEndsAt }: TTrialNoticeProps) => {
  const t = useTranslations('ownerHomePage');
  const tPlan = useTranslations('planNames');
  const locale = useLocale();

  return (
    <Alert
      type={ALERT_TYPE.INFO}
      title={t('trialTitle', { plan: tPlan(plan) })}
      description={t('trialDescription', {
        plan: tPlan(plan),
        freePlan: tPlan(TENANT_PLAN.FREE),
        date: formatDate(trialEndsAt, locale),
      })}
    />
  );
};

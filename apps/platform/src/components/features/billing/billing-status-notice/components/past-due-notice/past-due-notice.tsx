import { ALERT_TYPE, SIZE } from '@blog/config';
import type { TTenantPlan } from '@blog/config/constants';
import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

export type TPastDueNoticeProps = {
  plan: TTenantPlan;
};

export const PastDueNotice = ({ plan }: TPastDueNoticeProps) => {
  const t = useTranslations('billingStatusNotice');
  const tPlan = useTranslations('planNames');

  return (
    <Alert
      type={ALERT_TYPE.WARNING}
      title={t('pastDueTitle')}
      description={t('pastDueDescription', { plan: tPlan(plan) })}
      action={
        <LinkButton href={adminRoutes.dashboardBilling()} size={SIZE.SM}>
          {t('pastDueAction')}
        </LinkButton>
      }
    />
  );
};

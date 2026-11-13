import { ALERT_TYPE, SIZE } from '@blog/config';
import type { TTenantPlan } from '@blog/config/constants';
import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

export type TSubscribedNoticeProps = {
  plan: TTenantPlan;
};

export const SubscribedNotice = ({ plan }: TSubscribedNoticeProps) => {
  const t = useTranslations('upgradePage');
  const tPlan = useTranslations('planNames');

  return (
    <Alert
      type={ALERT_TYPE.SUCCESS}
      title={t('subscribedTitle', { plan: tPlan(plan) })}
      description={t('subscribedDescription')}
      action={
        <LinkButton href={adminRoutes.dashboard()} size={SIZE.SM}>
          {t('backToOverview')}
        </LinkButton>
      }
    />
  );
};

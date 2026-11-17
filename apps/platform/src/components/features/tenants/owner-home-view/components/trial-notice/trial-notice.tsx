import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import { richDate } from '@platform/utils/rich-date/rich-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTrial } from '@platform/utils/trial-for/trial-for';
import { ALERT_TYPE, SIZE } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { useLocale, useTranslations } from 'next-intl';

export type TTrialNoticeProps = {
  trial: TTrial;
  canUpgrade: boolean;
};

export const TrialNotice = ({
  trial: { plan, endsAt, hasEnded },
  canUpgrade,
}: TTrialNoticeProps) => {
  const t = useTranslations('ownerHomePage');
  const tPlan = useTranslations('planNames');
  const locale = useLocale();
  const planName = tPlan(plan);

  return (
    <Alert
      type={ALERT_TYPE.INFO}
      role="note"
      title={t(hasEnded ? 'trialEndedTitle' : 'trialTitle', { plan: planName })}
      description={t.rich(
        hasEnded ? 'trialEndedDescription' : 'trialDescription',
        {
          plan: planName,
          freePlan: tPlan(TENANT_PLAN.FREE),
          ...richDate(endsAt, locale),
        },
      )}
      action={
        canUpgrade && (
          <LinkButton href={adminRoutes.dashboardUpgrade()} size={SIZE.SM}>
            {t('trialUpgrade')}
          </LinkButton>
        )
      }
    />
  );
};

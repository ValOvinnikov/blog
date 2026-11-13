import { ALERT_TYPE, SIZE } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import { formatDate } from '@platform/utils/format-date/format-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTrial } from '@platform/utils/trial-for/trial-for';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

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
          date: formatDate(endsAt, locale),
          time: (chunks: ReactNode) => (
            <time dateTime={endsAt.toISOString()}>{chunks}</time>
          ),
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

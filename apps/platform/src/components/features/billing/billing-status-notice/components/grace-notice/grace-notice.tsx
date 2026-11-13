import { ALERT_TYPE, SIZE } from '@blog/config';
import type { TTenantPlan } from '@blog/config/constants';
import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import type { TGraceLocks } from '@platform/server/billing/load-grace-locks';
import { formatDate } from '@platform/utils/format-date/format-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

export type TGraceNoticeProps = {
  plan: TTenantPlan;
  endsAt: Date;
  locks: TGraceLocks;
  canUpgrade: boolean;
};

export const GraceNotice = ({
  plan,
  endsAt,
  locks: { lockedMemberCount, domainRedirect },
  canUpgrade,
}: TGraceNoticeProps) => {
  const t = useTranslations('billingStatusNotice');
  const tPlan = useTranslations('planNames');
  const locale = useLocale();
  const dateValues = {
    date: formatDate(endsAt, locale),
    time: (chunks: ReactNode) => (
      <time dateTime={endsAt.toISOString()}>{chunks}</time>
    ),
  };

  return (
    <Alert
      type={ALERT_TYPE.WARNING}
      title={t('graceTitle', { plan: tPlan(plan) })}
      description={
        <>
          {lockedMemberCount > 0 && (
            <p>
              {t.rich('graceMembers', {
                ...dateValues,
                count: lockedMemberCount,
              })}
            </p>
          )}
          {domainRedirect && (
            <p>{t.rich('graceDomain', { ...dateValues, ...domainRedirect })}</p>
          )}
          <p>{t(canUpgrade ? 'graceKeep' : 'graceKeepAskOwner')}</p>
        </>
      }
      action={
        canUpgrade && (
          <LinkButton href={adminRoutes.dashboardUpgrade()} size={SIZE.SM}>
            {t('graceUpgrade')}
          </LinkButton>
        )
      }
    />
  );
};

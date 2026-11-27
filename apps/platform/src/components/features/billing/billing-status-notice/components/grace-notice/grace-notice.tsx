import { Alert } from '@platform/components/shared/alert';
import { UpgradeLinkButton } from '@platform/components/shared/upgrade-link-button';
import { richDate } from '@platform/utils/rich-date/rich-date';
import { ALERT_TYPE } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import type { TGraceLocks } from '@shinefold/db/utils/grace-locks/grace-locks';
import { useLocale, useTranslations } from 'next-intl';

export type TGraceNoticeProps = {
  plan: TTenantPlan;
  endsAt: Date;
  locks: TGraceLocks;
  canUpgrade: boolean;
};

export const GraceNotice = ({
  plan,
  endsAt,
  locks: { lockedMemberCount, customDomain, subdomain },
  canUpgrade,
}: TGraceNoticeProps) => {
  const t = useTranslations('billingStatusNotice');
  const tPlan = useTranslations('planNames');
  const locale = useLocale();
  const dateValues = richDate(endsAt, locale);

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
          {customDomain && subdomain && (
            <p>
              {t.rich('graceDomain', {
                ...dateValues,
                customDomain,
                subdomain,
              })}
            </p>
          )}
          <p>{t(canUpgrade ? 'graceKeep' : 'graceKeepAskOwner')}</p>
        </>
      }
      action={
        canUpgrade && <UpgradeLinkButton>{t('graceUpgrade')}</UpgradeLinkButton>
      }
    />
  );
};

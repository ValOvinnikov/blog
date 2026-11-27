import { Alert } from '@platform/components/shared/alert';
import { UpgradeLinkButton } from '@platform/components/shared/upgrade-link-button';
import { richDate } from '@platform/utils/rich-date/rich-date';
import type { TTeamViewModel } from '@platform/utils/team-view-model/team-view-model';
import { ALERT_TYPE } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { hasLength } from '@shinefold/utils/primitives';
import { useFormatter, useLocale, useTranslations } from 'next-intl';

export type TOverSeatsNoticeProps = {
  plan: TTenantPlan;
  team: Pick<
    TTeamViewModel,
    'seats' | 'seatsOver' | 'graceEndsAt' | 'emailsLosingAccess'
  >;
  canUpgrade: boolean;
};

export const OverSeatsNotice = ({
  plan,
  team: { seats, seatsOver, graceEndsAt, emailsLosingAccess },
  canUpgrade,
}: TOverSeatsNoticeProps) => {
  const t = useTranslations('teamPage');
  const tPlan = useTranslations('planNames');
  const locale = useLocale();
  const format = useFormatter();
  const planName = tPlan(plan);
  const names = format.list(
    emailsLosingAccess.map((email) => email ?? t('thisMember')),
  );

  return (
    <Alert
      type={ALERT_TYPE.WARNING}
      title={t('overSeatsTitle', { count: seatsOver, plan: planName })}
      description={
        <>
          <p>{t('overSeatsBody', { plan: planName, seats })}</p>
          {graceEndsAt && (
            <p>
              {hasLength(emailsLosingAccess)
                ? t.rich('overSeatsLosing', {
                    ...richDate(graceEndsAt, locale),
                    names,
                    count: emailsLosingAccess.length,
                  })
                : t.rich('overSeatsDeadline', richDate(graceEndsAt, locale))}
            </p>
          )}
          {canUpgrade && <p>{t('overSeatsKeep')}</p>}
        </>
      }
      action={
        canUpgrade && <UpgradeLinkButton>{t('upgrade')}</UpgradeLinkButton>
      }
    />
  );
};

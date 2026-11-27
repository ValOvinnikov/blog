import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTeamViewModel } from '@platform/utils/team-view-model/team-view-model';
import { ALERT_TYPE, SIZE } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { useTranslations } from 'next-intl';

export type TLockedMembersNoticeProps = {
  id: string;
  plan: TTenantPlan;
  team: Pick<TTeamViewModel, 'seats' | 'lockedCount'>;
  canUpgrade: boolean;
};

export const LockedMembersNotice = ({
  id,
  plan,
  team: { seats, lockedCount },
  canUpgrade,
}: TLockedMembersNoticeProps) => {
  const t = useTranslations('teamPage');
  const tPlan = useTranslations('planNames');

  return (
    <Alert
      id={id}
      type={ALERT_TYPE.WARNING}
      title={t('lockedTitle', { count: lockedCount })}
      description={
        <>
          <p>{t('lockedBody', { plan: tPlan(plan), seats })}</p>
          <p>{t(canUpgrade ? 'lockedRestore' : 'lockedRestoreAskOwner')}</p>
        </>
      }
      action={
        canUpgrade && (
          <LinkButton href={adminRoutes.dashboardUpgrade()} size={SIZE.SM}>
            {t('upgrade')}
          </LinkButton>
        )
      }
    />
  );
};

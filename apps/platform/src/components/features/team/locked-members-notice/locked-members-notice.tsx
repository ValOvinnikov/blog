import { Alert } from '@platform/components/shared/alert';
import { UpgradeLinkButton } from '@platform/components/shared/upgrade-link-button';
import { TEAM_SEAT_NOTICE_ID } from '@platform/constants/team-access';
import type { TTeamViewModel } from '@platform/utils/team-view-model/team-view-model';
import { ALERT_TYPE } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { useTranslations } from 'next-intl';

export type TLockedMembersNoticeProps = {
  plan: TTenantPlan;
  team: Pick<TTeamViewModel, 'seats' | 'lockedCount'>;
  canUpgrade: boolean;
};

export const LockedMembersNotice = ({
  plan,
  team: { seats, lockedCount },
  canUpgrade,
}: TLockedMembersNoticeProps) => {
  const t = useTranslations('teamPage');
  const tPlan = useTranslations('planNames');

  return (
    <Alert
      id={TEAM_SEAT_NOTICE_ID}
      type={ALERT_TYPE.WARNING}
      title={t('lockedTitle', { count: lockedCount })}
      description={
        <>
          <p>{t('lockedBody', { plan: tPlan(plan), seats })}</p>
          <p>{t(canUpgrade ? 'lockedRestore' : 'lockedRestoreAskOwner')}</p>
        </>
      }
      action={
        canUpgrade && <UpgradeLinkButton>{t('upgrade')}</UpgradeLinkButton>
      }
    />
  );
};

import { LockedMembersNotice } from '@platform/components/features/team/locked-members-notice';
import { OverSeatsNotice } from '@platform/components/features/team/over-seats-notice';
import { Alert } from '@platform/components/shared/alert';
import { TEAM_SEAT_NOTICE_ID } from '@platform/constants/team-access';
import type { TTeamViewModel } from '@platform/utils/team-view-model/team-view-model';
import { ALERT_TYPE } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { useTranslations } from 'next-intl';

export type TTeamSeatNoticeProps = {
  plan: TTenantPlan;
  team: TTeamViewModel;
  canUpgrade: boolean;
};

export const TeamSeatNotice = ({
  plan,
  team,
  canUpgrade,
}: TTeamSeatNoticeProps) => {
  const t = useTranslations('teamPage');
  const tPlan = useTranslations('planNames');
  const { seats, seatsOver, lockedCount, isFull } = team;

  if (seatsOver > 0) {
    return <OverSeatsNotice plan={plan} team={team} canUpgrade={canUpgrade} />;
  }
  if (lockedCount > 0) {
    return (
      <LockedMembersNotice
        id={TEAM_SEAT_NOTICE_ID}
        plan={plan}
        team={team}
        canUpgrade={canUpgrade}
      />
    );
  }
  if (!isFull) return null;

  return (
    <Alert
      id={TEAM_SEAT_NOTICE_ID}
      type={ALERT_TYPE.INFO}
      title={t('seatLimitTitle')}
      description={t('seatLimitBody', { plan: tPlan(plan), seats })}
    />
  );
};

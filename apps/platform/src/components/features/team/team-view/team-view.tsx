import { InviteEditorControl } from '@platform/components/features/team/invite-editor-control';
import { MembersTable } from '@platform/components/features/team/members-table';
import { OverSeatsNotice } from '@platform/components/features/team/over-seats-notice';
import { PendingInvitesTable } from '@platform/components/features/team/pending-invites-table';
import { Alert } from '@platform/components/shared/alert';
import { PageHeader } from '@platform/components/shared/page-header';
import { Text } from '@platform/components/shared/text';
import { TEAM_SEAT_NOTICE_ID } from '@platform/constants/team-access';
import type { TTeamViewModel } from '@platform/utils/team-view-model/team-view-model';
import { ALERT_TYPE } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { hasLength } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

import { teamViewVariants } from './team-view-variants';

export type TTeamViewProps = {
  tenantId: string;
  plan: TTenantPlan;
  team: TTeamViewModel;
};

export const TeamView = ({ tenantId, plan, team }: TTeamViewProps) => {
  const t = useTranslations('teamPage');
  const tPlan = useTranslations('planNames');
  const { root, headerActions } = teamViewVariants();
  const { seats, shownUsed, isFull, seatsOver, invites } = team;
  const isOverSeats = seatsOver > 0;

  return (
    <div className={root()}>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <div className={headerActions()}>
            <Text as="span" variant="meta">
              {t('seatsUsed', { used: shownUsed, seats })}
            </Text>
            {!isOverSeats && (
              <InviteEditorControl
                tenantId={tenantId}
                plan={plan}
                isFull={isFull}
              />
            )}
          </div>
        }
      />
      {isOverSeats ? (
        <OverSeatsNotice plan={plan} team={team} />
      ) : (
        isFull && (
          <Alert
            id={TEAM_SEAT_NOTICE_ID}
            type={ALERT_TYPE.WARNING}
            title={t('seatLimitTitle')}
            description={t('seatLimitBody', { plan: tPlan(plan), seats })}
          />
        )
      )}
      <MembersTable tenantId={tenantId} team={team} />
      {hasLength(invites) && (
        <PendingInvitesTable tenantId={tenantId} invites={invites} />
      )}
    </div>
  );
};

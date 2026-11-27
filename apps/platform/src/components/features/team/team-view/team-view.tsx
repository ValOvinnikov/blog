import { InviteEditorControl } from '@platform/components/features/team/invite-editor-control';
import { MembersTable } from '@platform/components/features/team/members-table';
import { PendingInvitesTable } from '@platform/components/features/team/pending-invites-table';
import { PageHeader } from '@platform/components/shared/page-header';
import { Text } from '@platform/components/shared/text';
import type { TTeamViewModel } from '@platform/utils/team-view-model/team-view-model';
import type { TTenantPlan } from '@shinefold/config/constants';
import { hasLength } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

import { TeamSeatNotice } from './components/team-seat-notice/team-seat-notice';
import { teamViewVariants } from './team-view-variants';

export type TTeamViewProps = {
  tenantId: string;
  plan: TTenantPlan;
  team: TTeamViewModel;
  canUpgrade: boolean;
};

export const TeamView = ({
  tenantId,
  plan,
  team,
  canUpgrade,
}: TTeamViewProps) => {
  const t = useTranslations('teamPage');
  const { root, headerActions } = teamViewVariants();
  const { seats, shownUsed, isFull, seatsOver, invites } = team;

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
            {seatsOver === 0 && (
              <InviteEditorControl
                tenantId={tenantId}
                plan={plan}
                isFull={isFull}
              />
            )}
          </div>
        }
      />
      <TeamSeatNotice plan={plan} team={team} canUpgrade={canUpgrade} />
      <MembersTable tenantId={tenantId} team={team} />
      {hasLength(invites) && (
        <PendingInvitesTable tenantId={tenantId} invites={invites} />
      )}
    </div>
  );
};

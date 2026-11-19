import { CancelInviteControl } from '@platform/components/features/team/cancel-invite-control';
import { TeamDate } from '@platform/components/features/team/team-date';
import { TeamPerson } from '@platform/components/features/team/team-person';
import { useTeamTableColumns } from '@platform/components/features/team/team-table-columns';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { AVATAR_VARIANT } from '@platform/constants/avatar';
import {
  TEAM_COLUMN,
  TEAM_INVITES_HEADING_ID,
} from '@platform/constants/team-access';
import { formatDate } from '@platform/utils/format-date/format-date';
import type { TTeamInviteRow } from '@platform/utils/team-view-model/team-view-model';
import type { TLocaleIsoCode } from '@shinefold/config';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { pendingInvitesTableVariants } from './pending-invites-table-variants';

export type TPendingInvitesTableProps = {
  tenantId: string;
  invites: TTeamInviteRow[];
};

export const PendingInvitesTable = ({
  tenantId,
  invites,
}: TPendingInvitesTableProps) => {
  const t = useTranslations('teamPage.invites');
  const tRole = useTranslations('roleLabel');
  const locale = useLocale() as TLocaleIsoCode;
  const columns = useTeamTableColumns();
  const { accessNote } = pendingInvitesTableVariants();

  return (
    <DataTableShell
      items={invites}
      ariaLabel={t('title')}
      emptyMessage={t('title')}
      columns={columns}
      isStacked={true}
      renderRow={({ inviteId, email, role, invitedAt, isInvitedToday }) => {
        const values = {
          date: formatDate(invitedAt, locale),
          role: tRole(role),
          time: (chunks: ReactNode) => (
            <TeamDate date={invitedAt}>{chunks}</TeamDate>
          ),
        };

        return (
          <DataTableShell.Row key={inviteId}>
            <DataTableShell.Cell column={TEAM_COLUMN.PERSON}>
              <TeamPerson
                email={email}
                avatarVariant={AVATAR_VARIANT.PENDING}
                detail={t.rich(
                  isInvitedToday ? 'invitedToday' : 'invited',
                  values,
                )}
                stackedDetail={t.rich(
                  isInvitedToday ? 'invitedTodayWithRole' : 'invitedWithRole',
                  values,
                )}
              />
            </DataTableShell.Cell>
            <DataTableShell.Cell
              column={TEAM_COLUMN.ROLE}
              isHiddenWhenStacked={true}
            >
              {tRole(role)}
            </DataTableShell.Cell>
            <DataTableShell.Cell column={TEAM_COLUMN.ACCESS}>
              <span className={accessNote()}>{t('studioAccess')}</span>
            </DataTableShell.Cell>
            <DataTableShell.Cell column={TEAM_COLUMN.ACTIONS}>
              <CancelInviteControl
                tenantId={tenantId}
                inviteId={inviteId}
                email={email}
              />
            </DataTableShell.Cell>
          </DataTableShell.Row>
        );
      }}
    >
      <DataTableShell.Title
        id={TEAM_INVITES_HEADING_ID}
        count={t('count', { count: invites.length })}
        supportingText={t('supportingText')}
      >
        {t('title')}
      </DataTableShell.Title>
    </DataTableShell>
  );
};

import { MemberStudioAccess } from '@platform/components/features/team/member-studio-access';
import { RemoveMemberControl } from '@platform/components/features/team/remove-member-control';
import { TeamPerson } from '@platform/components/features/team/team-person';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { AVATAR_VARIANT } from '@platform/constants/avatar';
import {
  TEAM_COLUMN,
  TEAM_MEMBERS_HEADING_ID,
} from '@platform/constants/team-access';
import { richDate } from '@platform/utils/rich-date/rich-date';
import type { TTeamViewModel } from '@platform/utils/team-view-model/team-view-model';
import { useTeamTableColumns } from '@platform/utils/use-team-table-columns/use-team-table-columns';
import { hasLength } from '@shinefold/utils/primitives';
import { useLocale, useTranslations } from 'next-intl';

export type TMembersTableProps = {
  tenantId: string;
  team: Pick<TTeamViewModel, 'members' | 'hasEditor' | 'freeSeats'>;
};

export const MembersTable = ({ tenantId, team }: TMembersTableProps) => {
  const t = useTranslations('teamPage.members');
  const tRole = useTranslations('roleLabel');
  const locale = useLocale();
  const columns = useTeamTableColumns();
  const { members, hasEditor, freeSeats } = team;

  return (
    <DataTableShell
      items={members}
      ariaLabel={t('title')}
      emptyMessage={t('empty')}
      columns={columns}
      isStacked={true}
      renderRow={(member) => {
        const { membershipId, email, role, joinedAt, isJoinedToday } = member;
        const values = {
          ...richDate(joinedAt, locale),
          role: tRole(role),
        };

        return (
          <DataTableShell.Row key={membershipId}>
            <DataTableShell.Cell column={TEAM_COLUMN.PERSON}>
              <TeamPerson
                email={email}
                avatarVariant={AVATAR_VARIANT.MEMBER}
                isYou={member.isYou}
                detail={t.rich(
                  isJoinedToday ? 'joinedToday' : 'joined',
                  values,
                )}
                stackedDetail={t.rich(
                  isJoinedToday ? 'joinedTodayWithRole' : 'joinedWithRole',
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
              <MemberStudioAccess tenantId={tenantId} member={member} />
            </DataTableShell.Cell>
            {member.canRemove && (
              <DataTableShell.Cell column={TEAM_COLUMN.ACTIONS}>
                <RemoveMemberControl
                  tenantId={tenantId}
                  membershipId={membershipId}
                  email={email}
                />
              </DataTableShell.Cell>
            )}
          </DataTableShell.Row>
        );
      }}
    >
      <DataTableShell.Title
        id={TEAM_MEMBERS_HEADING_ID}
        count={t('count', { count: members.length })}
      >
        {t('title')}
      </DataTableShell.Title>
      {hasLength(members) && !hasEditor && (
        <DataTableShell.Note>
          {freeSeats === 0
            ? t('noEditorsNoFreeSeats')
            : t('noEditors', { free: freeSeats })}
        </DataTableShell.Note>
      )}
    </DataTableShell>
  );
};

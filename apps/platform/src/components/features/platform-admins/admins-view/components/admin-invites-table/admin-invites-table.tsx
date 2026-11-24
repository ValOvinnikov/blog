import { CancelAdminInviteControl } from '@platform/components/features/platform-admins/admins-view/components/admin-invites-table/components/cancel-admin-invite-control/cancel-admin-invite-control';
import { ResendAdminInviteControl } from '@platform/components/features/platform-admins/admins-view/components/admin-invites-table/components/resend-admin-invite-control/resend-admin-invite-control';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { ADMIN_INVITES_HEADING_ID } from '@platform/constants/platform-admins';
import type { TAdminInviteRow } from '@platform/server/platform-admins/load-platform-admins';
import { formatDate } from '@platform/utils/format-date/format-date';
import { tv } from '@platform/utils/tv/tv';
import { useLocale, useTranslations } from 'next-intl';

const adminInvitesTableVariants = tv({
  slots: {
    actions: ['flex flex-wrap items-center justify-end gap-2'],
  },
});

export type TAdminInvitesTableProps = {
  invites: TAdminInviteRow[];
};

export const AdminInvitesTable = ({ invites }: TAdminInvitesTableProps) => {
  const t = useTranslations('adminInvitesTable');
  const tRole = useTranslations('roleLabel');
  const locale = useLocale();
  const { actions } = adminInvitesTableVariants();

  return (
    <DataTableShell
      items={invites}
      emptyMessage={t('empty')}
      ariaLabel={t('title')}
      columns={[
        { key: 'email', label: t('columnEmail') },
        { key: 'role', label: t('columnRole') },
        { key: 'invitedAt', label: t('columnInvited') },
        { key: 'status', label: t('columnStatus') },
        {
          key: 'actions',
          label: t('columnActions'),
          isLabelHidden: true,
        },
      ]}
      renderRow={({ inviteId, email, role, invitedAt, isExpired }) => (
        <DataTableShell.Row key={inviteId}>
          <DataTableShell.Cell>{email}</DataTableShell.Cell>
          <DataTableShell.Cell>{tRole(role)}</DataTableShell.Cell>
          <DataTableShell.Cell>
            <time dateTime={invitedAt.toISOString()}>
              {formatDate(invitedAt, locale)}
            </time>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <StatusBadge
              tone={isExpired ? BADGE_TONE.WARN : BADGE_TONE.NEUTRAL}
            >
              {t(isExpired ? 'statusExpired' : 'statusPending')}
            </StatusBadge>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <div className={actions()}>
              <ResendAdminInviteControl inviteId={inviteId} email={email} />
              <CancelAdminInviteControl inviteId={inviteId} email={email} />
            </div>
          </DataTableShell.Cell>
        </DataTableShell.Row>
      )}
    >
      <DataTableShell.Title
        id={ADMIN_INVITES_HEADING_ID}
        count={t('count', { count: invites.length })}
        supportingText={t('supportingText')}
      >
        {t('title')}
      </DataTableShell.Title>
    </DataTableShell>
  );
};

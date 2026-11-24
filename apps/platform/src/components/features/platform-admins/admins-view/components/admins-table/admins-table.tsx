import { RemoveAdminControl } from '@platform/components/features/platform-admins/admins-view/components/admins-table/components/remove-admin-control/remove-admin-control';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { Text } from '@platform/components/shared/text';
import { ADMINS_HEADING_ID } from '@platform/constants/platform-admins';
import type { TPlatformAdminRow } from '@platform/server/platform-admins/load-platform-admins';
import { formatDate } from '@platform/utils/format-date/format-date';
import { useLocale, useTranslations } from 'next-intl';

export type TAdminsTableProps = {
  admins: TPlatformAdminRow[];
};

export const AdminsTable = ({ admins }: TAdminsTableProps) => {
  const t = useTranslations('adminsTable');
  const tRole = useTranslations('roleLabel');
  const locale = useLocale();

  return (
    <DataTableShell
      items={admins}
      emptyMessage={t('empty')}
      ariaLabel={t('title')}
      columns={[
        { key: 'name', label: t('columnName') },
        { key: 'email', label: t('columnEmail') },
        { key: 'role', label: t('columnRole') },
        { key: 'grantedAt', label: t('columnGranted') },
        {
          key: 'actions',
          label: t('columnActions'),
          isLabelHidden: true,
        },
      ]}
      renderRow={({ adminId, name, email, role, grantedAt, isYou }) => (
        <DataTableShell.Row key={adminId}>
          <DataTableShell.Cell>
            {name ?? t('noName')}
            {isYou && (
              <>
                {' '}
                <Text as="span" variant="meta">
                  {t('you')}
                </Text>
              </>
            )}
          </DataTableShell.Cell>
          <DataTableShell.Cell>{email ?? t('noEmail')}</DataTableShell.Cell>
          <DataTableShell.Cell>{tRole(role)}</DataTableShell.Cell>
          <DataTableShell.Cell>
            <time dateTime={grantedAt.toISOString()}>
              {formatDate(grantedAt, locale)}
            </time>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            {!isYou && (
              <RemoveAdminControl
                adminId={adminId}
                displayName={name ?? email ?? t('noName')}
              />
            )}
          </DataTableShell.Cell>
        </DataTableShell.Row>
      )}
    >
      <DataTableShell.Title
        id={ADMINS_HEADING_ID}
        count={t('count', { count: admins.length })}
      >
        {t('title')}
      </DataTableShell.Title>
    </DataTableShell>
  );
};

import { RemoveBlockedIdentityControl } from '@platform/components/features/blocked-signups/blocked-signups-view/components/blocked-signups-table/components/remove-blocked-identity-control/remove-blocked-identity-control';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TBlockedSignupEntry } from '@platform/server/signup-block/load-blocked-signup-entries';
import { formatDate } from '@platform/utils/format-date/format-date';
import { tv } from '@platform/utils/tv/tv';
import { useLocale, useTranslations } from 'next-intl';

const blockedSignupsTableVariants = tv({
  slots: {
    visuallyHidden: ['sr-only'],
    value: ['font-mono text-admin-12-5 break-all'],
  },
});

export type TBlockedSignupsTableProps = {
  entries: TBlockedSignupEntry[];
};

export const BlockedSignupsTable = ({ entries }: TBlockedSignupsTableProps) => {
  const t = useTranslations('blockedSignupsTable');
  const tKind = useTranslations('blockedSignupKindLabel');
  const locale = useLocale();
  const { visuallyHidden, value } = blockedSignupsTableVariants();

  return (
    <DataTableShell
      items={entries}
      emptyMessage={t('empty')}
      ariaLabel={t('regionLabel')}
      columns={[
        { key: 'kind', label: t('columnKind') },
        { key: 'value', label: t('columnValue') },
        { key: 'reason', label: t('columnReason') },
        { key: 'addedBy', label: t('columnAddedBy') },
        { key: 'added', label: t('columnAdded') },
        {
          key: 'actions',
          label: <span className={visuallyHidden()}>{t('columnActions')}</span>,
        },
      ]}
      renderRow={(entry) => (
        <DataTableShell.Row key={entry.id}>
          <DataTableShell.Cell>
            <StatusBadge tone="neutral" hasDot={false}>
              {tKind(entry.kind)}
            </StatusBadge>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <span className={value()}>{entry.displayValue}</span>
          </DataTableShell.Cell>
          <DataTableShell.Cell>{entry.reason}</DataTableShell.Cell>
          <DataTableShell.Cell>
            {entry.addedBy ?? t('addedByUnknown')}
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <time dateTime={entry.createdAt.toISOString()}>
              {formatDate(entry.createdAt, locale)}
            </time>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <RemoveBlockedIdentityControl entry={entry} />
          </DataTableShell.Cell>
        </DataTableShell.Row>
      )}
    />
  );
};

import { BlockSuspensionSource } from '@platform/components/features/blocked-signups/blocked-signups-view/components/blocked-signups-table/components/block-suspension-source/block-suspension-source';
import { RemoveBlockedIdentityControl } from '@platform/components/features/blocked-signups/blocked-signups-view/components/blocked-signups-table/components/remove-blocked-identity-control/remove-blocked-identity-control';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { DATA_TABLE_COLUMN } from '@platform/constants/data-table';
import { BLOCKED_SIGNUPS_COLUMN } from '@platform/constants/signup-block';
import type { TBlockedSignupEntry } from '@platform/server/signup-block/load-blocked-signup-entries';
import { formatDate } from '@platform/utils/format-date/format-date';
import { tv } from '@platform/utils/tv/tv';
import { useLocale, useTranslations } from 'next-intl';

const blockedSignupsTableVariants = tv({
  slots: {
    value: ['font-mono text-platform-12-5 break-all'],
    reason: ['flex flex-col gap-1'],
  },
});

export type TBlockedSignupsTableProps = {
  entries: TBlockedSignupEntry[];
};

export const BlockedSignupsTable = ({ entries }: TBlockedSignupsTableProps) => {
  const t = useTranslations('blockedSignupsTable');
  const tKind = useTranslations('blockedSignupKindLabel');
  const locale = useLocale();
  const { value, reason } = blockedSignupsTableVariants();

  return (
    <DataTableShell
      items={entries}
      emptyMessage={t('empty')}
      ariaLabel={t('regionLabel')}
      columns={[
        { key: BLOCKED_SIGNUPS_COLUMN.KIND, label: t('columnKind') },
        { key: BLOCKED_SIGNUPS_COLUMN.VALUE, label: t('columnValue') },
        { key: BLOCKED_SIGNUPS_COLUMN.REASON, label: t('columnReason') },
        { key: BLOCKED_SIGNUPS_COLUMN.ADDED_BY, label: t('columnAddedBy') },
        { key: BLOCKED_SIGNUPS_COLUMN.ADDED_AT, label: t('columnAdded') },
        {
          key: DATA_TABLE_COLUMN.ACTIONS,
          label: t('columnActions'),
          isLabelHidden: true,
        },
      ]}
      renderRow={(entry) => (
        <DataTableShell.Row key={entry.id}>
          <DataTableShell.Cell>
            <StatusBadge tone={BADGE_TONE.NEUTRAL} hasDot={false}>
              {tKind(entry.kind)}
            </StatusBadge>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <span className={value()}>{entry.displayValue}</span>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <div className={reason()}>
              <span>{entry.reason}</span>
              {entry.suspension && (
                <BlockSuspensionSource suspension={entry.suspension} />
              )}
            </div>
          </DataTableShell.Cell>
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

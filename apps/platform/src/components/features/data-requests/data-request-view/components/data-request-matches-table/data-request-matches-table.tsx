import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TDataRequestMatch } from '@platform/server/data-requests/to-data-request-matches';
import { formatDate } from '@platform/utils/format-date/format-date';
import { tv } from '@platform/utils/tv/tv';
import { useLocale, useTranslations } from 'next-intl';

const dataRequestMatchesTableVariants = tv({
  slots: {
    secondary: ['text-admin-muted'],
  },
});

export type TDataRequestMatchesTableProps = {
  matches: TDataRequestMatch[];
};

export const DataRequestMatchesTable = ({
  matches,
}: TDataRequestMatchesTableProps) => {
  const t = useTranslations('dataRequestMatchesTable');
  const tKind = useTranslations('dataRequestMatchKind');
  const locale = useLocale();
  const { secondary } = dataRequestMatchesTableVariants();

  return (
    <DataTableShell
      items={matches}
      emptyMessage={t('empty')}
      ariaLabel={t('regionLabel')}
      columns={[
        { key: 'kind', label: t('columnKind') },
        { key: 'site', label: t('columnSite') },
        { key: 'email', label: t('columnEmail') },
        { key: 'recorded', label: t('columnRecorded') },
      ]}
      renderRow={({ key, kind, siteName, email, recordedAt }) => (
        <DataTableShell.Row key={key}>
          <DataTableShell.Cell>
            <StatusBadge tone="neutral" hasDot={false}>
              {tKind(kind)}
            </StatusBadge>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            {siteName ?? (
              <span className={secondary()}>{t('platformWide')}</span>
            )}
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            {email ?? <span className={secondary()}>{t('emailHashed')}</span>}
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <time dateTime={recordedAt.toISOString()}>
              {formatDate(recordedAt, locale)}
            </time>
          </DataTableShell.Cell>
        </DataTableShell.Row>
      )}
    />
  );
};

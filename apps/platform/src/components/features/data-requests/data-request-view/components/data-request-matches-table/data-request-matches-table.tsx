'use client';

import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { FormField } from '@platform/components/shared/form-field';
import { OptionSelect } from '@platform/components/shared/option-select';
import { Pagination } from '@platform/components/shared/pagination';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { TextInput } from '@platform/components/shared/text-input';
import {
  DATA_REQUEST_KIND_FILTER,
  DATA_REQUEST_MATCH_COLUMN,
  type TDataRequestMatchColumn,
} from '@platform/constants/data-request';
import type { TDataRequestMatch } from '@platform/server/data-requests/to-data-request-matches';
import { formatDate } from '@platform/utils/format-date/format-date';
import { tv } from '@platform/utils/tv/tv';
import { useLocale, useTranslations } from 'next-intl';

import { useDataRequestMatchesTable } from './use-data-request-matches-table';

const dataRequestMatchesTableVariants = tv({
  slots: {
    secondary: ['text-admin-muted'],
    searchField: ['min-w-0 flex-1 basis-56'],
    kindField: ['w-full sm:w-56'],
  },
});

const COLUMN_LABEL_KEYS = {
  [DATA_REQUEST_MATCH_COLUMN.KIND]: 'columnKind',
  [DATA_REQUEST_MATCH_COLUMN.SITE]: 'columnSite',
  [DATA_REQUEST_MATCH_COLUMN.EMAIL]: 'columnEmail',
  [DATA_REQUEST_MATCH_COLUMN.RECORDED]: 'columnRecorded',
} as const satisfies Record<TDataRequestMatchColumn, string>;

export type TDataRequestMatchesTableProps = {
  matches: TDataRequestMatch[];
};

export const DataRequestMatchesTable = ({
  matches,
}: TDataRequestMatchesTableProps) => {
  const t = useTranslations('dataRequestMatchesTable');
  const tKind = useTranslations('dataRequestMatchKind');
  const locale = useLocale();
  const { secondary, searchField, kindField } =
    dataRequestMatchesTableVariants();
  const {
    query,
    changeQuery,
    kindFilter,
    changeKindFilter,
    kindOptions,
    sort,
    sortBy,
    pageRows,
    page,
    totalPages,
    setPage,
  } = useDataRequestMatchesTable(
    matches,
    ({ kind, siteName, email, recordedAt }) => ({
      [DATA_REQUEST_MATCH_COLUMN.KIND]: tKind(kind),
      [DATA_REQUEST_MATCH_COLUMN.SITE]: siteName ?? t('platformWide'),
      [DATA_REQUEST_MATCH_COLUMN.EMAIL]: email ?? t('emailHashed'),
      [DATA_REQUEST_MATCH_COLUMN.RECORDED]: recordedAt
        ? formatDate(recordedAt, locale)
        : t('notRecorded'),
    }),
  );

  return (
    <>
      <DataTableShell
        items={pageRows}
        emptyMessage={t('noResults')}
        ariaLabel={t('regionLabel')}
        toolbar={
          <>
            <div className={searchField()}>
              <FormField label={t('searchLabel')}>
                <TextInput type="search" value={query} onChange={changeQuery} />
              </FormField>
            </div>
            <div className={kindField()}>
              <FormField label={t('kindFilterLabel')}>
                <OptionSelect
                  options={[
                    {
                      value: DATA_REQUEST_KIND_FILTER.ALL,
                      label: t('allKinds'),
                    },
                    ...kindOptions.map((kind) => ({
                      value: kind,
                      label: tKind(kind),
                    })),
                  ]}
                  value={kindFilter}
                  onChange={changeKindFilter}
                />
              </FormField>
            </div>
          </>
        }
        columns={Object.values(DATA_REQUEST_MATCH_COLUMN).map((column) => ({
          key: column,
          label: t(COLUMN_LABEL_KEYS[column]),
          sort: {
            direction: sort.column === column ? sort.direction : undefined,
            onSort: () => sortBy(column),
          },
        }))}
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
              {recordedAt ? (
                <time dateTime={recordedAt.toISOString()}>
                  {formatDate(recordedAt, locale)}
                </time>
              ) : (
                <span className={secondary()}>{t('notRecorded')}</span>
              )}
            </DataTableShell.Cell>
          </DataTableShell.Row>
        )}
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
};

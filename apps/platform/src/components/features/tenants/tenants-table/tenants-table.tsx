'use client';

import {
  DataTableShell,
  nextSort,
} from '@platform/components/shared/data-table-shell';
import { Pagination } from '@platform/components/shared/pagination';
import { DATA_TABLE_COLUMN } from '@platform/constants/data-table';
import { TENANTS_PAGE_SIZE } from '@platform/constants/tenant';
import { toPageRange } from '@platform/utils/pagination/pagination';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { useTenantsListNavigation } from '@platform/utils/use-tenants-list-navigation/use-tenants-list-navigation';
import { TENANT_SORT_COLUMN, type TTenantSortColumn } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import { useOptimistic, type ReactNode } from 'react';

import {
  TenantsTableRow,
  type TTenantsTableTenant,
} from './components/row/tenants-table-row';

const COLUMN_LABEL_KEYS = {
  [TENANT_SORT_COLUMN.NAME]: 'columnTenant',
  [TENANT_SORT_COLUMN.PLAN]: 'columnPlan',
  [TENANT_SORT_COLUMN.STATUS]: 'columnStatus',
  [TENANT_SORT_COLUMN.CREATED]: 'columnCreated',
} as const satisfies Record<TTenantSortColumn, string>;

export type TTenantsTableProps = {
  tenants: TTenantsTableTenant[];
  total: number;
  totalPages: number;
  listQuery: TTenantsListQuery;
  toolbar: ReactNode;
};

export const TenantsTable = ({
  tenants,
  total,
  totalPages,
  listQuery,
  toolbar,
}: TTenantsTableProps) => {
  const t = useTranslations('tenantsTable');
  const tView = useTranslations('tenantsView');
  const { navigate } = useTenantsListNavigation(listQuery);
  const [sort, setOptimisticSort] = useOptimistic(listQuery.sort);
  const { page } = listQuery;
  const range = toPageRange({
    page,
    pageSize: TENANTS_PAGE_SIZE,
    rowCount: tenants.length,
    total,
  });

  const sortBy = (column: TTenantSortColumn) => {
    const next = nextSort(sort, column);
    navigate({ sort: next }, () => setOptimisticSort(next));
  };

  return (
    <DataTableShell
      items={tenants}
      emptyMessage={
        listQuery.search
          ? t('noMatches', { search: listQuery.search })
          : t('empty')
      }
      ariaLabel={tView('title')}
      isStacked={true}
      columns={[
        ...Object.values(TENANT_SORT_COLUMN).map((column) => ({
          key: column,
          label: t(COLUMN_LABEL_KEYS[column]),
          sort: {
            direction: sort.column === column ? sort.direction : undefined,
            onSort: () => sortBy(column),
          },
        })),
        {
          key: DATA_TABLE_COLUMN.ACTIONS,
          label: t('columnActions'),
          isLabelHidden: true,
        },
      ]}
      renderRow={(tenant) => (
        <TenantsTableRow key={tenant.id} tenant={tenant} />
      )}
    >
      <DataTableShell.Toolbar>{toolbar}</DataTableShell.Toolbar>
      {total > 0 && (
        <DataTableShell.Footer>
          <span>{t(totalPages > 1 ? 'showing' : 'count', range)}</span>
          <Pagination
            page={page}
            totalPages={totalPages}
            pageHref={(target) =>
              adminRoutes.tenants({ ...listQuery, page: target })
            }
          />
        </DataTableShell.Footer>
      )}
    </DataTableShell>
  );
};

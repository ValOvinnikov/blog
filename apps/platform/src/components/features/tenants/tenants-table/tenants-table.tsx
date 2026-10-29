'use client';

import { SIZE, TENANT_SORT_COLUMN, type TTenantSortColumn } from '@blog/config';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import { Avatar } from '@platform/components/shared/avatar';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { formatDate } from '@platform/utils/format-date/format-date';
import { nextSort } from '@platform/utils/next-sort/next-sort';
import { adminRoutes } from '@platform/utils/routes/routes';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { useTenantsListNavigation } from '@platform/utils/use-tenants-list-navigation/use-tenants-list-navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useOptimistic, type ReactNode } from 'react';

import { tenantsTableVariants } from './tenants-table-variants';

const COLUMN_LABEL_KEYS = {
  [TENANT_SORT_COLUMN.NAME]: 'columnTenant',
  [TENANT_SORT_COLUMN.PLAN]: 'columnPlan',
  [TENANT_SORT_COLUMN.STATUS]: 'columnStatus',
  [TENANT_SORT_COLUMN.CREATED]: 'columnCreated',
} as const satisfies Record<TTenantSortColumn, string>;

export type TTenantsTableProps = {
  tenants: TClientTenant[];
  listQuery: TTenantsListQuery;
  toolbar: ReactNode;
};

const manageHrefFor = (tenant: TClientTenant): string =>
  tenant.provisioningStatus === TENANT_PROVISIONING_STATUS.READY
    ? adminRoutes.tenantOverview(tenant.id)
    : adminRoutes.tenantProvisioning(tenant.id);

export const TenantsTable = ({
  tenants,
  listQuery,
  toolbar,
}: TTenantsTableProps) => {
  const t = useTranslations('tenantsTable');
  const tView = useTranslations('tenantsView');
  const locale = useLocale();
  const { navigate } = useTenantsListNavigation(listQuery);
  const [sort, setOptimisticSort] = useOptimistic(listQuery.sort);
  const { visuallyHidden, tname, name, domain } = tenantsTableVariants();

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
      toolbar={toolbar}
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
          key: 'actions',
          label: <span className={visuallyHidden()}>{t('columnActions')}</span>,
        },
      ]}
      renderRow={(tenant) => (
        <DataTableShell.Row key={tenant.id}>
          <DataTableShell.Cell>
            <div className={tname()}>
              <Avatar name={tenant.name} variant="table" />
              <div>
                <div className={name()}>{tenant.name}</div>
                <div className={domain()}>{tenant.primaryDomain}</div>
              </div>
            </div>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <StatusBadge tone="plan" hasDot={false}>
              {t(`plan.${tenant.plan}`)}
            </StatusBadge>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <StatusBadge tone={tenantStatusTone(tenant.status)}>
              {t(`status.${tenant.status}`)}
            </StatusBadge>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <time dateTime={tenant.createdAt.toISOString()}>
              {formatDate(tenant.createdAt, locale)}
            </time>
          </DataTableShell.Cell>
          <DataTableShell.Cell>
            <LinkButton
              href={manageHrefFor(tenant)}
              variant="secondary"
              size={SIZE.SM}
              ariaLabel={t('manageAriaLabel', { tenantName: tenant.name })}
              hasArrow={true}
            >
              {t('manage')}
            </LinkButton>
          </DataTableShell.Cell>
        </DataTableShell.Row>
      )}
    />
  );
};

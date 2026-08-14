import {
  tenantPlanTone,
  tenantStatusTone,
} from '@admin/utils/tenant-badges/tenant-badges';
import type { TTenant } from '@blog/db/schema/tenants';
import { StatusBadge } from '@blog/ui/atoms';
import { useTranslations } from 'next-intl';

import { tenantsTableVariants } from './tenants-table-variants';

export type TTenantsTableProps = {
  tenants: TTenant[];
};

const formatCreatedAt = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

/**
 * Every tenant on the platform, with status and plan visible at a glance.
 * Purely presentational — the page fetching `listTenants()` owns the data.
 */
export function TenantsTable({ tenants }: TTenantsTableProps) {
  const t = useTranslations('tenantsTable');
  const { wrapper, table, head, row, cell, name, domain, empty } =
    tenantsTableVariants();

  if (tenants.length === 0) {
    return (
      <div className={wrapper()}>
        <p className={empty()}>{t('empty')}</p>
      </div>
    );
  }

  return (
    <div className={wrapper()}>
      <table className={table()}>
        <thead>
          <tr>
            <th className={head()} scope="col">
              {t('columnTenant')}
            </th>
            <th className={head()} scope="col">
              {t('columnPlan')}
            </th>
            <th className={head()} scope="col">
              {t('columnStatus')}
            </th>
            <th className={head()} scope="col">
              {t('columnCreated')}
            </th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr className={row()} key={tenant.id}>
              <td className={cell()}>
                <p className={name()}>{tenant.name}</p>
                <p className={domain()}>{tenant.primaryDomain}</p>
              </td>
              <td className={cell()}>
                <StatusBadge tone={tenantPlanTone(tenant.plan)}>
                  {t(`plan.${tenant.plan}`)}
                </StatusBadge>
              </td>
              <td className={cell()}>
                <StatusBadge tone={tenantStatusTone(tenant.status)}>
                  {t(`status.${tenant.status}`)}
                </StatusBadge>
              </td>
              <td className={cell()}>{formatCreatedAt(tenant.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

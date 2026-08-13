import {
  tenantPlanBadge,
  tenantStatusBadge,
} from '@admin/utils/tenant-badges/tenant-badges';
import type { TTenant } from '@blog/db/schema/tenants';
import { StatusBadge } from '@blog/ui/atoms';

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
  const { wrapper, table, head, row, cell, slug, domain, empty } =
    tenantsTableVariants();

  if (tenants.length === 0) {
    return (
      <div className={wrapper()}>
        <p className={empty()}>No tenants yet.</p>
      </div>
    );
  }

  return (
    <div className={wrapper()}>
      <table className={table()}>
        <thead>
          <tr>
            <th className={head()} scope="col">
              Tenant
            </th>
            <th className={head()} scope="col">
              Plan
            </th>
            <th className={head()} scope="col">
              Status
            </th>
            <th className={head()} scope="col">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => {
            const status = tenantStatusBadge(tenant.status);
            const plan = tenantPlanBadge(tenant.plan);

            return (
              <tr className={row()} key={tenant.id}>
                <td className={cell()}>
                  <p className={slug()}>{tenant.slug}</p>
                  <p className={domain()}>{tenant.primaryDomain}</p>
                </td>
                <td className={cell()}>
                  <StatusBadge tone={plan.tone}>{plan.label}</StatusBadge>
                </td>
                <td className={cell()}>
                  <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                </td>
                <td className={cell()}>{formatCreatedAt(tenant.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

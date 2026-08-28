import { Size } from '@blog/config';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { Avatar } from '@platform/components/shared/avatar';
import { Card } from '@platform/components/shared/card';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { formatDate } from '@platform/utils/format-date/format-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

import { tenantsTableVariants } from './tenants-table-variants';

export type TTenantsTableProps = {
  tenants: TTenant[];
};

// A tenant only lands on its overview once provisioning has actually
// finished — anything else (never started, still running, or stuck on a
// failure) sends the operator straight to where they need to act instead.
const manageHrefFor = (tenant: TTenant): string =>
  tenant.provisioningStatus === TENANT_PROVISIONING_STATUS.READY
    ? adminRoutes.tenantOverview(tenant.id)
    : adminRoutes.tenantProvisioning(tenant.id);

/**
 * Every tenant on the platform, with status and plan visible at a glance.
 * Purely presentational — the page fetching `listTenants()` owns the data.
 */
export const TenantsTable = ({ tenants }: TTenantsTableProps) => {
  const t = useTranslations('tenantsTable');
  const { card, table, head, row, cell, tname, name, domain, empty } =
    tenantsTableVariants();

  if (tenants.length === 0) {
    return (
      <Card className={card()}>
        <Card.Body>
          <p className={empty()}>{t('empty')}</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className={card()}>
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
            <th className={head()} scope="col" />
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr className={row()} key={tenant.id}>
              <td className={cell()}>
                <div className={tname()}>
                  <Avatar name={tenant.name} variant="table" />
                  <div>
                    <div className={name()}>{tenant.name}</div>
                    <div className={domain()}>{tenant.primaryDomain}</div>
                  </div>
                </div>
              </td>
              <td className={cell()}>
                <StatusBadge tone="plan" hasDot={false}>
                  {t(`plan.${tenant.plan}`)}
                </StatusBadge>
              </td>
              <td className={cell()}>
                <StatusBadge tone={tenantStatusTone(tenant.status)}>
                  {t(`status.${tenant.status}`)}
                </StatusBadge>
              </td>
              <td className={cell()}>{formatDate(tenant.createdAt)}</td>
              <td className={cell()}>
                <LinkButton
                  href={manageHrefFor(tenant)}
                  variant="ghost"
                  size={Size.SM}
                  ariaLabel={t('manageAriaLabel', { tenantName: tenant.name })}
                >
                  {t('manage')}
                </LinkButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

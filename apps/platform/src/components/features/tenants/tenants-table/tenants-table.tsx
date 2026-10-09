import { SIZE } from '@blog/config';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { Avatar } from '@platform/components/shared/avatar';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { formatDate } from '@platform/utils/format-date/format-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { useLocale, useTranslations } from 'next-intl';

import { tenantsTableVariants } from './tenants-table-variants';

export type TTenantsTableProps = {
  tenants: TTenant[];
};

const manageHrefFor = (tenant: TTenant): string =>
  tenant.provisioningStatus === TENANT_PROVISIONING_STATUS.READY
    ? adminRoutes.tenantOverview(tenant.id)
    : adminRoutes.tenantProvisioning(tenant.id);

export const TenantsTable = ({ tenants }: TTenantsTableProps) => {
  const t = useTranslations('tenantsTable');
  const tView = useTranslations('tenantsView');
  const locale = useLocale();
  const { visuallyHidden, tname, name, domain } = tenantsTableVariants();

  return (
    <DataTableShell
      items={tenants}
      emptyMessage={t('empty')}
      ariaLabel={tView('title')}
      columns={[
        { key: 'tenant', label: t('columnTenant') },
        { key: 'plan', label: t('columnPlan') },
        { key: 'status', label: t('columnStatus') },
        { key: 'created', label: t('columnCreated') },
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

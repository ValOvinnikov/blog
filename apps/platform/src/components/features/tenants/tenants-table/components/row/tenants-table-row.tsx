import { Avatar } from '@platform/components/shared/avatar';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { LinkButton } from '@platform/components/shared/link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { AVATAR_VARIANT } from '@platform/constants/avatar';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { DATA_TABLE_COLUMN } from '@platform/constants/data-table';
import { formatDate } from '@platform/utils/format-date/format-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { tenantStatusTone } from '@platform/utils/status-tone/status-tone';
import { SIZE, TENANT_SORT_COLUMN } from '@shinefold/config';
import { TENANT_PROVISIONING_STATUS } from '@shinefold/db/constants';
import type { TTenantsPageRow } from '@shinefold/db/queries/tenants/tenants-page-row';
import { useLocale, useTranslations } from 'next-intl';

import { tenantsTableRowVariants } from './tenants-table-row-variants';

export type TTenantsTableTenant = Pick<
  TTenantsPageRow,
  | 'id'
  | 'name'
  | 'primaryDomain'
  | 'plan'
  | 'status'
  | 'provisioningStatus'
  | 'createdAt'
  | 'matchedDomain'
>;

export type TTenantsTableRowProps = {
  tenant: TTenantsTableTenant;
};

const manageHrefFor = (tenant: TTenantsTableTenant): string =>
  tenant.provisioningStatus === TENANT_PROVISIONING_STATUS.READY
    ? adminRoutes.tenantOverview(tenant.id)
    : adminRoutes.tenantProvisioning(tenant.id);

export const TenantsTableRow = ({ tenant }: TTenantsTableRowProps) => {
  const t = useTranslations('tenantsTable');
  const tPlan = useTranslations('planNames');
  const locale = useLocale();
  const { tname, lines, name, domain } = tenantsTableRowVariants();
  const {
    name: tenantName,
    primaryDomain,
    plan,
    status,
    createdAt,
    matchedDomain,
  } = tenant;

  return (
    <DataTableShell.Row>
      <DataTableShell.Cell column={TENANT_SORT_COLUMN.NAME}>
        <div className={tname()}>
          <Avatar name={tenantName} variant={AVATAR_VARIANT.TABLE} />
          <div className={lines()}>
            <div className={name()}>{tenantName}</div>
            <div className={domain()}>{primaryDomain}</div>
            {matchedDomain && (
              <div className={domain()}>
                {t('matchedDomain', { domain: matchedDomain })}
              </div>
            )}
          </div>
        </div>
      </DataTableShell.Cell>
      <DataTableShell.Cell column={TENANT_SORT_COLUMN.PLAN}>
        <StatusBadge tone={BADGE_TONE.PLAN} hasDot={false}>
          {tPlan(plan)}
        </StatusBadge>
      </DataTableShell.Cell>
      <DataTableShell.Cell column={TENANT_SORT_COLUMN.STATUS}>
        <StatusBadge tone={tenantStatusTone(status)}>
          {t(`status.${status}`)}
        </StatusBadge>
      </DataTableShell.Cell>
      <DataTableShell.Cell column={TENANT_SORT_COLUMN.CREATED}>
        <time dateTime={createdAt.toISOString()}>
          {formatDate(createdAt, locale)}
        </time>
      </DataTableShell.Cell>
      <DataTableShell.Cell column={DATA_TABLE_COLUMN.ACTIONS}>
        <LinkButton
          href={manageHrefFor(tenant)}
          variant={BUTTON_VARIANT.SECONDARY}
          size={SIZE.SM}
          ariaLabel={t('manageAriaLabel', { tenantName })}
          hasArrow={true}
        >
          {t('manage')}
        </LinkButton>
      </DataTableShell.Cell>
    </DataTableShell.Row>
  );
};

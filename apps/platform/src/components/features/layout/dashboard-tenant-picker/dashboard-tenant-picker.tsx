import type { TTenant } from '@blog/db/schema/tenants';
import { PreShellFrame } from '@platform/components/features/layout/pre-shell-frame';
import { Heading } from '@platform/components/shared/heading';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { Link } from '@platform/i18n/navigation';
import { adminRoutes } from '@platform/utils/routes/routes';
import { toTenantSwitcherItems } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';
import { useTranslations } from 'next-intl';

import { dashboardTenantPickerVariants } from './dashboard-tenant-picker-variants';

export type TDashboardTenantPickerProps = {
  tenants: TTenant[];
};

export const DashboardTenantPicker = ({
  tenants,
}: TDashboardTenantPickerProps) => {
  const t = useTranslations('dashboardTenantPicker');
  const tSwitcher = useTranslations('tenantSwitcher');
  const { description, list, row, nameRow, name, domain, badge } =
    dashboardTenantPickerVariants();

  if (tenants.length === 0) {
    return null;
  }

  return (
    <PreShellFrame>
      <Heading level={1} size="pageTitle">
        {t('heading')}
      </Heading>
      <Text variant="supporting" className={description()}>
        {t('description')}
      </Text>
      <ul className={list()}>
        {toTenantSwitcherItems(tenants).map((tenant) => (
          <li key={tenant.id}>
            <Link
              href={adminRoutes.dashboardSelectTenantHref(tenant.id)}
              prefetch={false}
              className={row()}
            >
              <span className={nameRow()}>
                <span className={name()}>{tenant.name}</span>
                {tenant.isArchived && (
                  <StatusBadge
                    tone="neutral"
                    hasDot={false}
                    className={badge()}
                  >
                    {tSwitcher('archived')}
                  </StatusBadge>
                )}
              </span>
              <span className={domain()}>{tenant.primaryDomain}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PreShellFrame>
  );
};

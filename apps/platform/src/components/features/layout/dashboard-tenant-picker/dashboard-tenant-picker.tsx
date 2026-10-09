import type { TTenant } from '@blog/db/schema/tenants';
import { PreShellFrame } from '@platform/components/features/layout/pre-shell-frame';
import { SignOutButton } from '@platform/components/features/layout/sign-out-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
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
  const { list, row, nameRow, name, domain, badge } =
    dashboardTenantPickerVariants();

  if (tenants.length === 0) {
    return null;
  }

  return (
    <PreShellFrame
      header={
        <PageHeader
          title={t('heading')}
          description={t('description')}
          actions={<SignOutButton />}
        />
      }
    >
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

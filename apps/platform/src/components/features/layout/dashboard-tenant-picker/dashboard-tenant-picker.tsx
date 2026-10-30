import type { TTenant } from '@blog/db/schema/tenants';
import { CenteredCardFrame } from '@platform/components/features/layout/centered-card-frame';
import { SignedInAccount } from '@platform/components/features/layout/signed-in-account';
import { PageHeader } from '@platform/components/shared/page-header';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Link } from '@platform/i18n/navigation';
import { adminRoutes } from '@platform/utils/routes/routes';
import { toTenantSwitcherItems } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';
import { useTranslations } from 'next-intl';

import { dashboardTenantPickerVariants } from './dashboard-tenant-picker-variants';

export type TDashboardTenantPickerProps = {
  tenants: TTenant[];
  accountEmail?: string;
};

export const DashboardTenantPicker = ({
  tenants,
  accountEmail,
}: TDashboardTenantPickerProps) => {
  const t = useTranslations('dashboardTenantPicker');
  const tSwitcher = useTranslations('tenantSwitcher');
  const { content, list, row, nameRow, name, domain, badge, account } =
    dashboardTenantPickerVariants();

  if (tenants.length === 0) {
    return null;
  }

  return (
    <CenteredCardFrame>
      <div className={content()}>
        <PageHeader title={t('heading')} description={t('description')} />
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
        {accountEmail && (
          <div className={account()}>
            <SignedInAccount email={accountEmail} />
          </div>
        )}
      </div>
    </CenteredCardFrame>
  );
};

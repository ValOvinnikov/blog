import { TenantSwitcher } from '@admin/components/features/layout/tenant-switcher';
import { Heading } from '@admin/components/shared/heading';
import { Text } from '@admin/components/shared/text';
import { adminRoutes } from '@admin/utils/routes/routes';
import type { TTenant } from '@blog/db/schema/tenants';
import { useTranslations } from 'next-intl';

import { dashboardTenantPickerVariants } from './dashboard-tenant-picker-variants';

export type TDashboardTenantPickerProps = {
  /** Every tenant the signed-in user has a membership on — always more than one; a single membership resolves without ever reaching this page. */
  tenants: TTenant[];
};

/**
 * Shown at `/dashboard/select-tenant` before a slug-free dashboard session
 * has an "active tenant" cookie. Reuses `TenantSwitcher`'s own tenant-list
 * rendering rather than a second list UI — only its link target differs,
 * pointing at the cookie-setting `/api/dashboard/select-tenant` endpoint
 * instead of the slug-routed `/t/{slug}`.
 */
export const DashboardTenantPicker = ({
  tenants,
}: TDashboardTenantPickerProps) => {
  const t = useTranslations('dashboardTenantPicker');

  const [firstTenant] = tenants;

  if (!firstTenant) {
    return null;
  }

  return (
    <div className={dashboardTenantPickerVariants()}>
      <Heading level={1} size="pageTitle">
        {t('heading')}
      </Heading>
      <Text variant="supporting">{t('description')}</Text>
      <TenantSwitcher
        tenants={tenants}
        activeTenantId={firstTenant.id}
        hrefFor={(tenant) => adminRoutes.dashboardSelectTenantHref(tenant.id)}
      />
    </div>
  );
};

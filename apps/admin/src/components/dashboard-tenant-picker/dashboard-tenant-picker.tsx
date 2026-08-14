import { TenantSwitcher } from '@admin/components/tenant-switcher';
import { adminRoutes } from '@admin/utils/routes/routes';
import type { TTenant } from '@blog/db/schema/tenants';
import { Heading } from '@blog/ui/atoms/heading';
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
export function DashboardTenantPicker({
  tenants,
}: TDashboardTenantPickerProps) {
  const t = useTranslations('dashboardTenantPicker');
  const { root, description } = dashboardTenantPickerVariants();

  const [firstTenant] = tenants;

  if (!firstTenant) {
    return null;
  }

  return (
    <div className={root()}>
      <Heading level={1}>{t('heading')}</Heading>
      <p className={description()}>{t('description')}</p>
      <TenantSwitcher
        tenants={tenants}
        activeTenantId={firstTenant.id}
        hrefFor={(tenant) => adminRoutes.dashboardSelectTenantHref(tenant.id)}
      />
    </div>
  );
}

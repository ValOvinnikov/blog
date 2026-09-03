import type { TTenant } from '@blog/db/schema/tenants';
import { TenantSwitcher } from '@platform/components/features/layout/tenant-switcher';
import { Heading } from '@platform/components/shared/heading';
import { Text } from '@platform/components/shared/text';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

import { dashboardTenantPickerVariants } from './dashboard-tenant-picker-variants';

export type TDashboardTenantPickerProps = {
  /** Every tenant the signed-in user has a membership on — always more than one; a single membership resolves without ever reaching this page. */
  tenants: TTenant[];
};

/**
 * Shown at `/dashboard/select-tenant` before the session has an "active
 * tenant" cookie. Reuses `TenantSwitcher`'s own tenant-list rendering rather
 * than a second list UI — only its link target differs, pointing at the
 * cookie-setting `/api/dashboard/select-tenant` endpoint instead of the
 * id-routed `/tenants/{id}`.
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

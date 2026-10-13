import { AdminShell } from '@platform/components/features/layout/admin-shell';
import { TenantBreadcrumb } from '@platform/components/features/layout/tenant-breadcrumb';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { loadAdminShellChrome } from '@platform/server/layout/load-admin-shell-chrome';
import {
  operatorNavSections,
  tenantNavSections,
} from '@platform/utils/nav-sections/nav-sections';
import { getTranslations } from 'next-intl/server';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
};

/**
 * The `AdminShell` chrome for the tenant's regular pages — the ancestor
 * `layout.tsx` already gates this tree via `requireTenantById`; this layout
 * calls it again purely to read the resolved tenant/admin, deduped against
 * the ancestor's call by `requireTenantById`'s own `cache()` wrapper.
 */
export default async function TenantDetailLayout({ children, params }: TProps) {
  const { tenantId } = await params;
  const { tenant, admin } = await requireTenantById(tenantId);
  const [{ isSidebarInitiallyCollapsed, tNavSections, userName }, t] =
    await Promise.all([
      loadAdminShellChrome(),
      getTranslations('tenantLayout'),
    ]);

  return (
    <AdminShell
      isSidebarInitiallyCollapsed={isSidebarInitiallyCollapsed}
      sections={[
        ...operatorNavSections(tNavSections),
        ...tenantNavSections(tNavSections, tenant.id, tenant.name),
      ]}
      crumb={<TenantBreadcrumb tenantId={tenant.id} tenantName={tenant.name} />}
      roleChip={{
        name: userName,
        role: admin.role,
        scope: t('scopeLabel'),
      }}
    >
      {children}
    </AdminShell>
  );
}

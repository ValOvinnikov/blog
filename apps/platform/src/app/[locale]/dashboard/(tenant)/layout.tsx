import { queries } from '@blog/db';
import { AdminShell } from '@platform/components/features/layout/admin-shell';
import { DashboardBreadcrumb } from '@platform/components/features/layout/dashboard-breadcrumb';
import { TenantSwitcher } from '@platform/components/features/layout/tenant-switcher';
import { ShellStudioAccessProvider } from '@platform/context/shell-studio-access-provider';
import { isVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { listSessionTenants } from '@platform/server/auth/list-session-tenants';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { resolveTenantPageAccess } from '@platform/server/auth/resolve-tenant-page-access';
import { loadAdminShellChrome } from '@platform/server/layout/load-admin-shell-chrome';
import { resolveHasEnteredStudio } from '@platform/server/studio-entry/resolve-has-entered-studio';
import { dashboardNavSections } from '@platform/utils/dashboard-nav-sections/dashboard-nav-sections';
import { ownerStudioAccessFor } from '@platform/utils/owner-studio-access/owner-studio-access';
import { toTenantSwitcherItems } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';

type TProps = {
  children: React.ReactNode;
};

export default async function DashboardTenantLayout({ children }: TProps) {
  const { tenant, membership, tenants } = await resolveDashboardTenant();
  const [
    { admin: sessionAdmin },
    chrome,
    access,
    unreadLeadsCount,
    hasEnteredStudio,
  ] = await Promise.all([
    listSessionTenants(),
    loadAdminShellChrome(),
    resolveTenantPageAccess(tenant, membership),
    queries.leads.countUnreadLeadsForTenant(tenant.id),
    resolveHasEnteredStudio(tenant.id),
  ]);
  const { isSidebarInitiallyCollapsed, tNavSections, userName } = chrome;
  const studioAccess = ownerStudioAccessFor(tenant, membership);

  const admin = isVirtualAdminMembership(membership) ? sessionAdmin : undefined;

  return (
    <AdminShell
      isSidebarInitiallyCollapsed={isSidebarInitiallyCollapsed}
      sections={dashboardNavSections(
        tNavSections,
        access,
        studioAccess && { access: studioAccess, hasEntered: hasEnteredStudio },
        unreadLeadsCount,
      )}
      switcher={
        tenants.length > 1 ? (
          <TenantSwitcher
            tenants={toTenantSwitcherItems(tenants)}
            activeTenantId={tenant.id}
          />
        ) : undefined
      }
      crumb={<DashboardBreadcrumb />}
      roleChip={{
        name: userName,
        role: admin?.role ?? membership.role,
        scope: admin ? tNavSections('platformLabel') : tenant.name,
      }}
    >
      <ShellStudioAccessProvider studioAccess={studioAccess}>
        {children}
      </ShellStudioAccessProvider>
    </AdminShell>
  );
}

import { AdminShell } from '@platform/components/features/layout/admin-shell';
import { DashboardBreadcrumb } from '@platform/components/features/layout/dashboard-breadcrumb';
import { TenantSwitcher } from '@platform/components/features/layout/tenant-switcher';
import { isVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { listSessionTenants } from '@platform/server/auth/list-session-tenants';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { resolveTenantPageAccess } from '@platform/server/auth/resolve-tenant-page-access';
import { loadAdminShellChrome } from '@platform/server/layout/load-admin-shell-chrome';
import { dashboardNavSections } from '@platform/utils/nav-sections/nav-sections';
import { ownerStudioAccessFor } from '@platform/utils/owner-studio-access/owner-studio-access';
import { toTenantSwitcherItems } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';

type TProps = {
  children: React.ReactNode;
};

/**
 * Gates page rendering for everything nested under this segment behind the
 * signed-in user's own `memberships` rows (`resolveDashboardTenant`), with
 * the same platform SUPERADMIN bypass — `/dashboard`'s counterpart to
 * `/tenants/[tenantId]/layout.tsx`, which instead gates on any `admins` row
 * via `requireTenantById` regardless of role. Deliberately omits the
 * Platform nav section shown alongside Tenant on `/tenants/{id}`: this tree
 * exists specifically so a tenant owner never sees that the platform is
 * multi-tenant.
 */
export default async function DashboardTenantLayout({ children }: TProps) {
  const { tenant, membership, tenants } = await resolveDashboardTenant();
  const [{ admin: sessionAdmin }, chrome, access] = await Promise.all([
    listSessionTenants(),
    loadAdminShellChrome(),
    resolveTenantPageAccess(tenant, membership),
  ]);
  const { isSidebarInitiallyCollapsed, tNavSections, userName } = chrome;

  // A virtual membership is correct for authorization but never a correct
  // identity label, so the role chip shows the admin role behind it instead.
  const admin = isVirtualAdminMembership(membership) ? sessionAdmin : undefined;

  return (
    <AdminShell
      isSidebarInitiallyCollapsed={isSidebarInitiallyCollapsed}
      sections={dashboardNavSections(
        tNavSections,
        access,
        ownerStudioAccessFor(tenant, membership),
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
      {children}
    </AdminShell>
  );
}

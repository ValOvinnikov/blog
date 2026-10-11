import { AdminShell } from '@platform/components/features/layout/admin-shell';
import { DashboardBreadcrumb } from '@platform/components/features/layout/dashboard-breadcrumb';
import { TenantSwitcher } from '@platform/components/features/layout/tenant-switcher';
import { getSession } from '@platform/server/auth/auth';
import { isVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { listSessionTenants } from '@platform/server/auth/list-session-tenants';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { resolveIsSidebarCollapsed } from '@platform/server/layout/resolve-is-sidebar-collapsed';
import {
  dashboardNavSections,
  type TNavTranslator,
} from '@platform/utils/nav-sections/nav-sections';
import { planPageAccess } from '@platform/utils/plan-page-access/plan-page-access';
import { toTenantSwitcherItems } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';
import { getTranslations } from 'next-intl/server';

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
  const { admin: sessionAdmin } = await listSessionTenants();
  const session = await getSession();
  const isSidebarInitiallyCollapsed = await resolveIsSidebarCollapsed();
  const tNavSections = (await getTranslations(
    'navSections',
  )) as unknown as TNavTranslator;

  // A virtual membership is correct for authorization but never a correct
  // identity label, so the role chip shows the admin role behind it instead.
  const admin = isVirtualAdminMembership(membership) ? sessionAdmin : undefined;

  return (
    <AdminShell
      isSidebarInitiallyCollapsed={isSidebarInitiallyCollapsed}
      sections={dashboardNavSections(tNavSections, planPageAccess(tenant.plan))}
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
        name: session?.user?.name ?? session?.user?.email ?? undefined,
        role: admin?.role ?? membership.role,
        scope: admin ? tNavSections('platformLabel') : tenant.name,
      }}
    >
      {children}
    </AdminShell>
  );
}

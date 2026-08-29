import { queries } from '@blog/db';
import { AdminShell } from '@platform/components/features/layout/admin-shell';
import { DashboardBreadcrumb } from '@platform/components/features/layout/dashboard-breadcrumb';
import { TenantSwitcher } from '@platform/components/features/layout/tenant-switcher';
import { auth } from '@platform/server/auth/auth';
import { isVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { resolveIsSidebarCollapsed } from '@platform/server/layout/resolve-is-sidebar-collapsed';
import {
  dashboardNavSections,
  type TNavTranslator,
} from '@platform/utils/nav-sections/nav-sections';
import { adminRoutes } from '@platform/utils/routes/routes';
import { getTranslations } from 'next-intl/server';

type TProps = {
  children: React.ReactNode;
};

/**
 * Gates page rendering for everything nested under this segment behind the
 * signed-in user's own `memberships` rows (`resolveDashboardTenant`), with
 * the same platform SUPERADMIN bypass — `/dashboard`'s slug-free
 * counterpart to `/tenants/[tenantId]/layout.tsx`, which instead gates on
 * any `admins` row via `requireTenantById` regardless of role. Deliberately
 * omits the Platform nav section shown alongside Tenant on `/tenants/{id}`:
 * this tree exists specifically so a tenant owner never sees that the
 * platform is multi-tenant.
 */
export default async function DashboardTenantLayout({ children }: TProps) {
  const { tenant, membership, tenants } = await resolveDashboardTenant();
  const session = await auth();
  const isSidebarInitiallyCollapsed = await resolveIsSidebarCollapsed();
  const tNavSections = (await getTranslations(
    'navSections',
  )) as unknown as TNavTranslator;

  // A SUPERADMIN browsing here holds no real `memberships` row — `membership`
  // is `buildVirtualAdminMembership`'s virtual, OWNER-level stand-in, correct
  // for authorization but never a correct identity label.
  const isVirtual = isVirtualAdminMembership(membership);
  const admin = isVirtual
    ? await queries.admins.getAdminByUserId(membership.userId)
    : undefined;

  return (
    <AdminShell
      isSidebarInitiallyCollapsed={isSidebarInitiallyCollapsed}
      sections={dashboardNavSections(tNavSections)}
      switcher={
        tenants.length > 1 ? (
          <TenantSwitcher
            tenants={tenants}
            activeTenantId={tenant.id}
            hrefFor={(candidate) =>
              adminRoutes.dashboardSelectTenantHref(candidate.id)
            }
          />
        ) : undefined
      }
      crumb={<DashboardBreadcrumb />}
      roleChip={{
        name:
          session?.user?.name ??
          session?.user?.email ??
          admin?.role ??
          membership.role,
        role: admin?.role ?? membership.role,
        scope: admin ? tNavSections('platformLabel') : tenant.name,
      }}
    >
      {children}
    </AdminShell>
  );
}

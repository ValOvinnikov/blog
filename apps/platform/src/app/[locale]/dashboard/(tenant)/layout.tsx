import { queries } from '@blog/db';
import { hasArrayGotMultipleItems } from '@blog/utils/primitives';
import { BillingStatusNotice } from '@platform/components/features/billing/billing-status-notice';
import { DashboardBreadcrumb } from '@platform/components/features/layout/dashboard-breadcrumb';
import { PlatformShell } from '@platform/components/features/layout/platform-shell';
import { TenantSwitcher } from '@platform/components/features/layout/tenant-switcher';
import { OwnerSuspensionBanner } from '@platform/components/features/tenants/owner-suspension-banner';
import { UPGRADE_STATE } from '@platform/constants/billing';
import { ShellStudioAccessProvider } from '@platform/context/shell-studio-access-provider';
import { TenantPlanProvider } from '@platform/context/tenant-plan-provider';
import { listSessionTenants } from '@platform/server/auth/list-session-tenants';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { resolveTenantPageAccess } from '@platform/server/auth/resolve-tenant-page-access';
import { upgradeStateFor } from '@platform/server/billing/upgrade-state-for';
import { loadPlatformShellChrome } from '@platform/server/layout/load-platform-shell-chrome';
import { dashboardNavSections } from '@platform/utils/dashboard-nav-sections/dashboard-nav-sections';
import { ownerStudioAccessFor } from '@platform/utils/owner-studio-access/owner-studio-access';
import { toTenantSwitcherItems } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';
import { Suspense } from 'react';

type TProps = {
  children: React.ReactNode;
};

export default async function DashboardTenantLayout({ children }: TProps) {
  const { tenant, membership, viewer, tenants } =
    await resolveDashboardTenant();
  const [{ admin: sessionAdmin }, chrome, access, unreadLeadsCount] =
    await Promise.all([
      listSessionTenants(),
      loadPlatformShellChrome(),
      resolveTenantPageAccess(tenant, viewer),
      queries.leads.countUnreadLeadsForTenant(tenant.id),
    ]);
  const { isSidebarInitiallyCollapsed, tNavSections, userName, userEmail } =
    chrome;
  const studioAccess = ownerStudioAccessFor(tenant, viewer);

  const admin = viewer.isOperator ? sessionAdmin : undefined;

  return (
    <PlatformShell
      isSidebarInitiallyCollapsed={isSidebarInitiallyCollapsed}
      sections={dashboardNavSections(
        tNavSections,
        access,
        studioAccess,
        unreadLeadsCount,
      )}
      switcher={
        hasArrayGotMultipleItems(tenants) ? (
          <TenantSwitcher
            tenants={toTenantSwitcherItems(tenants)}
            activeTenantId={tenant.id}
          />
        ) : undefined
      }
      crumb={<DashboardBreadcrumb />}
      notice={
        <>
          <Suspense fallback={null}>
            <OwnerSuspensionBanner tenant={tenant} />
          </Suspense>
          <Suspense fallback={null}>
            <BillingStatusNotice
              tenant={tenant}
              canOpenBilling={access.billing}
              canUpgrade={
                upgradeStateFor(tenant, viewer) === UPGRADE_STATE.AVAILABLE
              }
            />
          </Suspense>
        </>
      }
      account={{
        name: userName,
        email: userEmail,
        role: admin?.role ?? membership.role,
        scope: admin ? tNavSections('platformLabel') : tenant.name,
      }}
    >
      <ShellStudioAccessProvider studioAccess={studioAccess}>
        <TenantPlanProvider plan={tenant.plan}>{children}</TenantPlanProvider>
      </ShellStudioAccessProvider>
    </PlatformShell>
  );
}

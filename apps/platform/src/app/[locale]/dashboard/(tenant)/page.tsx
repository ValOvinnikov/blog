import { OwnerHomeView } from '@platform/components/features/tenants/owner-home-view';
import { UPGRADE_STATE } from '@platform/constants/billing';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { upgradeStateFor } from '@platform/server/billing/upgrade-state-for';
import { getStartedFor } from '@platform/server/onboarding/get-started-for';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { siteSetupFor } from '@platform/server/provisioning/site-setup-for';
import { sampleContentFor } from '@platform/server/sample-content/sample-content-for';
import { adminRoutes } from '@platform/utils/routes/routes';
import { queries } from '@shinefold/db';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('ownerHome');
}

export default async function DashboardOverviewPage() {
  const { tenant, viewer } = await resolveDashboardTenant();

  const domainVerificationStatus = getDomainVerificationStatus(
    tenant.primaryDomain,
  );
  const [owner, getStarted] = await Promise.all([
    queries.memberships.getTenantOwnerMembership(tenant.id),
    getStartedFor(tenant, viewer),
  ]);

  return (
    <OwnerHomeView
      tenant={tenant}
      domainVerificationStatus={domainVerificationStatus}
      owner={owner}
      firstRun={{
        siteSetup: siteSetupFor(tenant, viewer),
        getStarted,
        sampleContent: sampleContentFor(tenant, viewer),
      }}
      canUpgrade={upgradeStateFor(tenant, viewer) === UPGRADE_STATE.AVAILABLE}
      usage={{
        links: {
          languages: adminRoutes.dashboardLanguages(),
          team: viewer.canManage ? adminRoutes.dashboardTeam() : undefined,
          subscribers:
            viewer.canManage && tenant.pageAccess.subscribers
              ? adminRoutes.dashboardSubscribers()
              : undefined,
        },
        hasPlansFooter: viewer.isOwner,
      }}
    />
  );
}

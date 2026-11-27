import { OwnerHomeView } from '@platform/components/features/tenants/owner-home-view';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { canOfferUpgrade } from '@platform/server/billing/can-offer-upgrade';
import { getStartedFor } from '@platform/server/onboarding/get-started-for';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { siteSetupFor } from '@platform/server/provisioning/site-setup-for';
import { sampleContentFor } from '@platform/server/sample-content/sample-content-for';
import { canManageSubscribers } from '@platform/server/subscribers/can-manage-subscribers';
import { adminRoutes } from '@platform/utils/routes/routes';
import { queries } from '@shinefold/db';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('ownerHome');
}

export default async function DashboardOverviewPage() {
  const context = await resolveDashboardTenant();
  const { tenant, viewer } = context;

  const domainVerificationStatus = getDomainVerificationStatus(
    tenant.primaryDomain,
  );
  const [owner, getStarted, hasSubscribers] = await Promise.all([
    queries.memberships.getTenantOwnerMembership(tenant.id),
    getStartedFor(tenant, viewer),
    canManageSubscribers(context),
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
      canUpgrade={canOfferUpgrade(tenant, viewer)}
      usage={{
        links: {
          languages: adminRoutes.dashboardLanguages(),
          team: viewer.canManage ? adminRoutes.dashboardTeam() : undefined,
          subscribers: hasSubscribers
            ? adminRoutes.dashboardSubscribers()
            : undefined,
        },
        hasPlansFooter: viewer.isOwner,
      }}
    />
  );
}

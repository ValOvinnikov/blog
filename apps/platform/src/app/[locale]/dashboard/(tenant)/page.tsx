import { queries } from '@blog/db';
import { OwnerHomeView } from '@platform/components/features/tenants/owner-home-view';
import { UPGRADE_STATE } from '@platform/constants/billing';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { upgradeStateFor } from '@platform/server/billing/upgrade-state-for';
import { getStartedFor } from '@platform/server/onboarding/get-started-for';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { siteSetupFor } from '@platform/server/provisioning/site-setup-for';
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
      siteSetup={siteSetupFor(tenant, viewer)}
      getStarted={getStarted}
      canUpgrade={upgradeStateFor(tenant, viewer) === UPGRADE_STATE.AVAILABLE}
    />
  );
}

import { queries } from '@blog/db';
import { OwnerHomeView } from '@platform/components/features/tenants/owner-home-view';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('ownerHome');
}

export default async function DashboardOverviewPage() {
  const { tenant } = await resolveDashboardTenant();

  const domainVerificationStatus = getDomainVerificationStatus(
    tenant.primaryDomain,
  );
  const owner = await queries.memberships.getTenantOwnerMembership(tenant.id);

  return (
    <OwnerHomeView
      tenant={tenant}
      domainVerificationStatus={domainVerificationStatus}
      owner={owner}
    />
  );
}

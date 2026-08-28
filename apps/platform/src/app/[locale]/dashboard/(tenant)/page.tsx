import { queries } from '@blog/db';
import { OwnerHomeView } from '@platform/components/features/tenants/owner-home-view';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { formatDate } from '@platform/utils/format-date/format-date';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('tenant') };
}

export default async function DashboardOverviewPage() {
  const { tenant } = await resolveDashboardTenant();

  const [domainVerificationStatus, ownerEmail, ownerMembership] =
    await Promise.all([
      getDomainVerificationStatus(tenant.primaryDomain),
      queries.memberships.getTenantOwnerEmail(tenant.id),
      queries.memberships.getTenantOwnerMembership(tenant.id),
    ]);

  return (
    <OwnerHomeView
      tenant={tenant}
      domainVerificationStatus={domainVerificationStatus}
      ownerEmail={ownerEmail}
      ownerJoinedAt={
        ownerMembership ? formatDate(ownerMembership.joinedAt) : undefined
      }
      ownerJoinedAtIso={ownerMembership?.joinedAt.toISOString()}
    />
  );
}

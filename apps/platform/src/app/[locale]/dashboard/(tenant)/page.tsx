import { queries } from '@blog/db';
import { OwnerHomeView } from '@platform/components/features/tenants/owner-home-view';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { formatDate } from '@platform/utils/format-date/format-date';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('ownerHome') };
}

export default async function DashboardOverviewPage() {
  const { tenant } = await resolveDashboardTenant();

  const domainVerificationStatus = getDomainVerificationStatus(
    tenant.primaryDomain,
  );
  const [ownerEmail, ownerMembership, locale] = await Promise.all([
    queries.memberships.getTenantOwnerEmail(tenant.id),
    queries.memberships.getTenantOwnerMembership(tenant.id),
    getLocale(),
  ]);

  return (
    <OwnerHomeView
      tenant={tenant}
      domainVerificationStatus={domainVerificationStatus}
      ownerEmail={ownerEmail}
      ownerJoinedAt={
        ownerMembership
          ? formatDate(ownerMembership.joinedAt, locale)
          : undefined
      }
      ownerJoinedAtIso={ownerMembership?.joinedAt.toISOString()}
    />
  );
}

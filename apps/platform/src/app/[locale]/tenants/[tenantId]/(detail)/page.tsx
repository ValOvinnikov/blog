import { AUDIT_TARGET_TYPE, FINDING_STATUS } from '@blog/config';
import { queries } from '@blog/db';
import { DomainCardSkeleton } from '@platform/components/features/tenants/domain-card-skeleton';
import { LiveDomainCard } from '@platform/components/features/tenants/live-domain-card';
import { TenantOverviewView } from '@platform/components/features/tenants/tenant-overview-view';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import { formatDate } from '@platform/utils/format-date/format-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('tenantOverview') };
}

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export default async function TenantOverviewPage({ params }: TProps) {
  const { tenantId } = await params;

  const [tenant] = await queries.tenants.listTenantsByIds([tenantId]);

  if (!tenant) {
    notFound();
  }

  const domainVerificationStatus = getDomainVerificationStatus(
    tenant.primaryDomain,
  );
  const [ownerEmail, ownerMembership, auditEvents, findings, locale] =
    await Promise.all([
      queries.memberships.getTenantOwnerEmail(tenant.id),
      queries.memberships.getTenantOwnerMembership(tenant.id),
      queries.auditEvents.listAuditEventsForTarget(
        AUDIT_TARGET_TYPE.TENANT,
        tenant.id,
        { limit: 5 },
      ),
      queries.findings.listFindingsForTenant(tenant.id, FINDING_STATUS.OPEN),
      getLocale(),
    ]);

  return (
    <TenantOverviewView
      tenant={tenant}
      domainCard={
        <Suspense fallback={<DomainCardSkeleton />}>
          <LiveDomainCard
            tenant={tenant}
            domainVerificationStatus={domainVerificationStatus}
            dnsHref={adminRoutes.tenantDomain(tenant.id)}
          />
        </Suspense>
      }
      ownerEmail={ownerEmail}
      ownerJoinedAt={
        ownerMembership
          ? formatDate(ownerMembership.joinedAt, locale)
          : undefined
      }
      ownerJoinedAtIso={ownerMembership?.joinedAt.toISOString()}
      auditEvents={auditEvents}
      findings={findings}
    />
  );
}

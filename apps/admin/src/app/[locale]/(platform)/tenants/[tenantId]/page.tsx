import { TenantOverviewView } from '@admin/components/features/tenants/tenant-overview-view';
import { getDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { formatDate } from '@admin/utils/format-date/format-date';
import { AUDIT_TARGET_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

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

  const [domainVerificationStatus, ownerEmail, ownerMembership, auditEvents] =
    await Promise.all([
      getDomainVerificationStatus(tenant.primaryDomain),
      queries.memberships.getTenantOwnerEmail(tenant.id),
      queries.memberships.getTenantOwnerMembership(tenant.id),
      queries.auditEvents.listAuditEventsForTarget(
        AUDIT_TARGET_TYPE.TENANT,
        tenant.id,
        { limit: 5 },
      ),
    ]);

  return (
    <TenantOverviewView
      tenant={tenant}
      domainVerificationStatus={domainVerificationStatus}
      ownerEmail={ownerEmail}
      ownerJoinedAt={
        ownerMembership ? formatDate(ownerMembership.joinedAt) : undefined
      }
      ownerJoinedAtIso={ownerMembership?.joinedAt.toISOString()}
      auditEvents={auditEvents}
    />
  );
}

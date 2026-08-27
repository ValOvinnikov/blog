import { TenantStatusView } from '@admin/components/features/tenants/tenant-status-view';
import { getDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { queries } from '@blog/db';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('tenantProvisioning') };
}

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export default async function TenantProvisioningPage({ params }: TProps) {
  const { tenantId } = await params;

  const [tenant] = await queries.tenants.listTenantsByIds([tenantId]);

  if (!tenant) {
    notFound();
  }

  const [domainVerificationStatus, ownerEmail] = await Promise.all([
    getDomainVerificationStatus(tenant.primaryDomain),
    queries.memberships.getTenantOwnerEmail(tenant.id),
  ]);

  return (
    <TenantStatusView
      tenant={tenant}
      domainVerificationStatus={domainVerificationStatus}
      ownerEmail={ownerEmail}
    />
  );
}

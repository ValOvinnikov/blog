import { TenantStatusView } from '@admin/components/tenant-status-view';
import { getDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { queries } from '@blog/db';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('tenantStatus') };
}

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export default async function TenantStatusPage({ params }: TProps) {
  const { tenantId } = await params;

  const [tenant] = await queries.tenants.listTenantsByIds([tenantId]);

  if (!tenant) {
    notFound();
  }

  const domainVerificationStatus = await getDomainVerificationStatus(
    tenant.primaryDomain,
  );

  return (
    <TenantStatusView
      tenant={tenant}
      domainVerificationStatus={domainVerificationStatus}
    />
  );
}

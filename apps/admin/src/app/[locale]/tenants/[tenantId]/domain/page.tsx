import { DomainPageContent } from '@admin/components/features/tenants/domain-page-content';
import { requireTenantById } from '@admin/server/auth/require-tenant-by-id';
import { getDomainDnsRecords } from '@admin/server/provisioning/get-domain-dns-records';
import { getDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('tenantDomain') };
}

export default async function TenantDomainPage({ params }: TProps) {
  const { tenantId } = await params;
  const { tenant } = await requireTenantById(tenantId);

  const [domainVerificationStatus, dnsRecords] = await Promise.all([
    getDomainVerificationStatus(tenant.primaryDomain),
    getDomainDnsRecords(tenant.primaryDomain),
  ]);

  return (
    <DomainPageContent
      tenant={tenant}
      domainVerificationStatus={domainVerificationStatus}
      dnsRecords={dnsRecords}
    />
  );
}

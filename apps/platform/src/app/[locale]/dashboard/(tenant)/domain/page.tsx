import { DomainPageContent } from '@platform/components/features/tenants/domain-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { getDomainDnsRecords } from '@platform/server/provisioning/get-domain-dns-records';
import { getDomainVerificationStatus } from '@platform/server/provisioning/get-domain-verification-status';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('tenantDomain') };
}

export default async function DashboardDomainPage() {
  const { tenant } = await resolveDashboardTenant();

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

import { ProvisioningStatusView } from '@admin/components/features/tenants/provisioning-status-view';
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

  const ownerEmail = await queries.memberships.getTenantOwnerEmail(tenant.id);

  return <ProvisioningStatusView tenant={tenant} ownerEmail={ownerEmail} />;
}

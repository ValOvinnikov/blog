import { queries } from '@blog/db';
import { ProvisioningStatusView } from '@platform/components/features/tenants/provisioning-status-view';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { toClientTenant } from '@platform/server/tenants/to-client-tenant';
import type { Metadata } from 'next';
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

  const { tenant } = await requireTenantById(tenantId);
  const ownerEmail = await queries.memberships.getTenantOwnerEmail(tenant.id);

  return (
    <ProvisioningStatusView
      tenant={toClientTenant(tenant)}
      ownerEmail={ownerEmail}
    />
  );
}

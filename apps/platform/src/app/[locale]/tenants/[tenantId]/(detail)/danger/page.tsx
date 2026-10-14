import { queries } from '@blog/db';
import { TenantDangerPageContent } from '@platform/components/features/tenants/tenant-danger-page-content';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { toClientTenant } from '@platform/server/tenants/to-client-tenant';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('tenantDanger');
}

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export default async function TenantDangerPage({ params }: TProps) {
  await requireSuperAdmin();
  const { tenantId } = await params;

  const { tenant } = await requireTenantById(tenantId);

  // Queried unconditionally: a request newer than any existing run, even a FAILED one, is how a retry restarts.
  const deprovisionRequestedAt =
    await queries.auditEvents.getLatestDeprovisionRequestedAt(tenantId);

  return (
    <TenantDangerPageContent
      tenant={toClientTenant(tenant)}
      deprovisionRequestedAt={deprovisionRequestedAt?.toISOString()}
    />
  );
}

import { BillingPageContent } from '@platform/components/features/billing/billing-page-content';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('tenantBilling');
}

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export default async function TenantBillingPage({ params }: TProps) {
  await requireSuperAdmin();
  const { tenantId } = await params;

  const { tenant, viewer } = await requireTenantById(tenantId);

  return (
    <BillingPageContent tenant={tenant} viewer={viewer} isReadOnly={true} />
  );
}

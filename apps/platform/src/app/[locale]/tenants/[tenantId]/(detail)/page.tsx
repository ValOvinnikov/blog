import { TenantOverviewView } from '@platform/components/features/tenants/tenant-overview-view';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('tenantOverview');
}

export default async function TenantOverviewPage({ params }: TProps) {
  const { tenantId } = await params;

  return renderTenantScopedPage(
    () => requireTenantById(tenantId),
    TenantOverviewView,
  );
}

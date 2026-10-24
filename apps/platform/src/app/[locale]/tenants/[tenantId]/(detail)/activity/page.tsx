import { TenantActivityPageContent } from '@platform/components/features/tenants/tenant-activity-page-content';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import { parsePage } from '@platform/utils/pagination/pagination';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('tenantActivity');
}

export default async function TenantActivityPage({
  params,
  searchParams,
}: TProps) {
  const [{ tenantId }, { page }] = await Promise.all([params, searchParams]);

  return renderTenantScopedPage(
    () => requireTenantById(tenantId),
    ({ tenant }) =>
      TenantActivityPageContent({ tenant, page: parsePage(page) }),
  );
}

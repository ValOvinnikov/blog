import { SubscribersPageContent } from '@platform/components/features/subscribers/subscribers-page-content';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import { parsePage } from '@platform/utils/pagination/pagination';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('subscribers');
}

export default async function TenantSubscribersPage({
  params,
  searchParams,
}: TProps) {
  const [{ tenantId }, { page }] = await Promise.all([params, searchParams]);

  return renderTenantScopedPage(
    () => requireTenantById(tenantId),
    ({ tenant, viewer }) =>
      SubscribersPageContent({
        tenant,
        viewer,
        page: parsePage(page),
        pageHref: (target) => adminRoutes.tenantSubscribers(tenant.id, target),
        movedUpCeiling: undefined,
      }),
    'subscribers',
  );
}

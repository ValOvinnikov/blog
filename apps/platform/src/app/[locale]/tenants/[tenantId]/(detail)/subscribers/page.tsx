import { SubscribersPageContent } from '@platform/components/features/subscribers/subscribers-page-content';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { requireOperatorSubscribersTenant } from '@platform/server/subscribers/require-operator-subscribers-tenant';
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
    () => requireOperatorSubscribersTenant(tenantId),
    ({ tenant, viewer }) =>
      SubscribersPageContent({
        tenant,
        viewer,
        page: parsePage(page),
        pageHref: (target) => adminRoutes.tenantSubscribers(tenant.id, target),
        studioPagesHref: adminRoutes.tenantStudioPages(tenant.id),
        movedUpCeiling: undefined,
      }),
  );
}

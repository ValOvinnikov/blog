import { SubscribersPageContent } from '@platform/components/features/subscribers/subscribers-page-content';
import { SUBSCRIBERS_SEARCH_PARAM } from '@platform/constants/subscribers';
import { resolveGatedDashboardTenant } from '@platform/server/auth/resolve-gated-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import { parsePage } from '@platform/utils/pagination/pagination';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';

type TProps = {
  searchParams: Promise<{
    page?: string;
    [SUBSCRIBERS_SEARCH_PARAM.MOVED_UP]?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('subscribers');
}

export default async function DashboardSubscribersPage({
  searchParams,
}: TProps) {
  const { page, [SUBSCRIBERS_SEARCH_PARAM.MOVED_UP]: movedUp } =
    await searchParams;

  return renderTenantScopedPage(
    resolveGatedDashboardTenant('subscribers'),
    ({ tenant, viewer }) =>
      SubscribersPageContent({
        tenant,
        viewer,
        page: parsePage(page),
        pageHref: adminRoutes.dashboardSubscribers,
        movedUpCeiling: movedUp ? Number(movedUp) : undefined,
      }),
  );
}

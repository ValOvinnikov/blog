import { LeadsPageContent } from '@platform/components/features/leads/leads-page-content';
import { resolveLeadsPageTenant } from '@platform/server/leads/resolve-leads-page-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import { parseLeadsPage } from '@platform/utils/leads-pagination/leads-pagination';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('leads');
}

type TProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function DashboardLeadsPage({ searchParams }: TProps) {
  const { page } = await searchParams;

  return renderTenantScopedPage(resolveLeadsPageTenant, ({ tenant }) =>
    LeadsPageContent({
      tenant,
      page: parseLeadsPage(page),
      pageHref: adminRoutes.dashboardLeads,
    }),
  );
}

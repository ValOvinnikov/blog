import { LeadsPageContent } from '@platform/components/features/leads/leads-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import { parseLeadsPage } from '@platform/utils/leads-pagination/leads-pagination';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('leads');
}

type TProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function DashboardLeadsPage({ searchParams }: TProps) {
  const { page } = await searchParams;

  return renderTenantScopedPage(
    resolveDashboardTenant,
    ({ tenant }) => LeadsPageContent({ tenant, page: parseLeadsPage(page) }),
    'leads',
  );
}

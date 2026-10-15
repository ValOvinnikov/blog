import { LeadsPageContent } from '@platform/components/features/leads/leads-page-content';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import { parseLeadsPage } from '@platform/utils/leads-pagination/leads-pagination';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('leads');
}

export default async function LeadsPage({ params, searchParams }: TProps) {
  const [{ tenantId }, { page }] = await Promise.all([params, searchParams]);

  return renderTenantScopedPage(
    () => requireTenantById(tenantId),
    ({ tenant }) =>
      LeadsPageContent({
        tenant,
        page: parseLeadsPage(page),
        pageHref: (nextPage) => adminRoutes.leads(tenant.id, nextPage),
      }),
  );
}

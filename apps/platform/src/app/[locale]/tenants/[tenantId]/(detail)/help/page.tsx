import { HelpPageContent } from '@platform/components/features/support/help-page-content';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('help');
}

export default async function TenantHelpPage({ params }: TProps) {
  const { tenantId } = await params;

  return renderTenantScopedPage(
    () => requireTenantById(tenantId),
    ({ tenant }) =>
      HelpPageContent({ tenant, helpPath: adminRoutes.tenantHelp(tenantId) }),
  );
}

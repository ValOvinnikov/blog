import { StudioMountView } from '@platform/components/features/studio/studio-mount-view';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('studio');
}

export default async function TenantStudioPage({ params }: TProps) {
  const { tenantId } = await params;

  return renderTenantScopedPage(
    () => requireTenantById(tenantId),
    ({ tenant }) =>
      StudioMountView({
        tenant,
        basePath: adminRoutes.tenantStudio(tenant.id),
      }),
  );
}

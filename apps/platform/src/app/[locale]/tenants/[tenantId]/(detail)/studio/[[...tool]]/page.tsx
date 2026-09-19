import { StudioMountView } from '@platform/components/features/studio/studio-mount-view';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import {
  renderTenantScopedPage,
  tenantPageMetadata,
} from '@platform/server/tenant-pages/render-tenant-scoped-page';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return tenantPageMetadata('studio');
}

/**
 * Gated via `requireTenantById`, not a `memberships` check — any `admins`
 * row may open any tenant's Studio regardless of that admin's own
 * `memberships` row for it, so editing the `tenantId` in the URL can't let
 * a tenant owner reach another tenant's Studio.
 */
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

import { FeaturesPageContent } from '@admin/components/features/capabilities/features-page-content';
import { requireTenantMembership } from '@admin/server/auth/require-tenant-membership';
import {
  renderTenantScopedPage,
  tenantPageMetadata,
} from '@admin/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ tenantSlug: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return tenantPageMetadata('features');
}

export default async function FeaturesPage({ params }: TProps) {
  const { tenantSlug } = await params;

  return renderTenantScopedPage(
    () => requireTenantMembership(tenantSlug),
    FeaturesPageContent,
  );
}

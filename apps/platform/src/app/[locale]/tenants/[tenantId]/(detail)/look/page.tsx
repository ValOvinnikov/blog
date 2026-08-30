import { LookPageContent } from '@platform/components/features/look/look-page-content';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import {
  renderTenantScopedPage,
  tenantPageMetadata,
} from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return tenantPageMetadata('look');
}

export default async function LookPage({ params }: TProps) {
  const { tenantId } = await params;

  return renderTenantScopedPage(
    () => requireTenantById(tenantId),
    LookPageContent,
  );
}

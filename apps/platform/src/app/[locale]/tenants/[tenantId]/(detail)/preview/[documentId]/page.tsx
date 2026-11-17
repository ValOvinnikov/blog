import { DraftPreviewPageContent } from '@platform/components/features/draft-preview/draft-preview-page-content';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ tenantId: string; documentId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('draftPreview');
}

export default async function TenantDraftPreviewPage({ params }: TProps) {
  const { tenantId, documentId } = await params;

  return renderTenantScopedPage(
    () => requireTenantById(tenantId),
    ({ tenant }) => DraftPreviewPageContent({ tenant, documentId }),
  );
}

import { DraftPreviewPageContent } from '@platform/components/features/draft-preview/draft-preview-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ documentId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('draftPreview');
}

export default async function DashboardDraftPreviewPage({ params }: TProps) {
  const { documentId } = await params;

  return renderTenantScopedPage(resolveDashboardTenant, ({ tenant }) =>
    DraftPreviewPageContent({ tenant, documentId }),
  );
}

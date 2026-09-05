import { EmailPageContent } from '@platform/components/features/email/email-page-content';
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
  return tenantPageMetadata('email');
}

export default async function EmailPage({ params }: TProps) {
  const { tenantId } = await params;

  return renderTenantScopedPage(
    () => requireTenantById(tenantId),
    EmailPageContent,
  );
}

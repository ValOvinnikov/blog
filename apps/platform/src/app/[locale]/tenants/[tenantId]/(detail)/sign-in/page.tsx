import { SignInAppsPageContent } from '@platform/components/features/sign-in-apps/sign-in-apps-page-content';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('signInApps');
}

export default async function TenantSignInAppsPage({ params }: TProps) {
  const { tenantId } = await params;

  return renderTenantScopedPage(
    () => requireTenantById(tenantId),
    SignInAppsPageContent,
  );
}

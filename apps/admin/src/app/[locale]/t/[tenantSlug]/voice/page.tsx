import { VoicePageContent } from '@admin/components/voice-page-content';
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
  return tenantPageMetadata('voice');
}

export default async function VoicePage({ params }: TProps) {
  const { tenantSlug } = await params;

  return renderTenantScopedPage(
    () => requireTenantMembership(tenantSlug),
    VoicePageContent,
  );
}

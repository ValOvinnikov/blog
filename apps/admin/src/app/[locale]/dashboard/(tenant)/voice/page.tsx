import { VoicePageContent } from '@admin/components/features/voice/voice-page-content';
import { resolveDashboardTenant } from '@admin/server/auth/resolve-dashboard-tenant';
import {
  renderTenantScopedPage,
  tenantPageMetadata,
} from '@admin/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return tenantPageMetadata('voice');
}

export default async function DashboardVoicePage() {
  return renderTenantScopedPage(resolveDashboardTenant, VoicePageContent);
}

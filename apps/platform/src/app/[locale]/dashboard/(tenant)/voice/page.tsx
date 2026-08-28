import { VoicePageContent } from '@platform/components/features/voice/voice-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import {
  renderTenantScopedPage,
  tenantPageMetadata,
} from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return tenantPageMetadata('voice');
}

export default async function DashboardVoicePage() {
  return renderTenantScopedPage(resolveDashboardTenant, VoicePageContent);
}

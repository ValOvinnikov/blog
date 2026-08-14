import { VoicePageContent } from '@admin/components/voice-page-content';
import { resolveDashboardTenant } from '@admin/server/auth/resolve-dashboard-tenant';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('voice') };
}

export default async function DashboardVoicePage() {
  const { tenant } = await resolveDashboardTenant();

  // Called directly (not `<VoicePageContent tenant={tenant} />`) — an async
  // component nested via JSX only resolves under React's real RSC renderer,
  // which this repo's `customRenderAsync` test helper doesn't emulate.
  return await VoicePageContent({ tenant });
}

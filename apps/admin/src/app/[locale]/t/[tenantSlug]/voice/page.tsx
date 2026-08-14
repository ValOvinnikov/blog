import { VoiceSettings } from '@admin/components/voice-settings';
import { requireTenantMembership } from '@admin/server/auth/require-tenant-membership';
import { PRESET_ID, PRESET_REGISTRY } from '@blog/config/constants';
import { queries } from '@blog/db';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { saveVoiceOverridesAction } from './save-voice-overrides-action';

type TProps = {
  params: Promise<{ tenantSlug: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('voice') };
}

export default async function VoicePage({ params }: TProps) {
  const { tenantSlug } = await params;
  const { tenant } = await requireTenantMembership(tenantSlug);
  const config = await queries.siteConfig.getSiteConfig(tenant.id);
  const presetId = config?.preset ?? PRESET_ID.CONSOLE;

  return (
    <VoiceSettings
      tenantSlug={tenant.slug}
      voicePack={PRESET_REGISTRY[presetId].voicePack}
      initialOverrides={config?.voiceOverrides ?? {}}
      saveAction={saveVoiceOverridesAction}
    />
  );
}

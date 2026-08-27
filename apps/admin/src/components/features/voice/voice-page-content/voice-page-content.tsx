import { VoiceSettings } from '@admin/components/features/voice/voice-settings';
import { PRESET_ID, PRESET_REGISTRY } from '@blog/config/constants';
import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';

import { saveVoiceOverridesAction } from './save-voice-overrides-action';

export type TVoicePageContentProps = {
  tenant: TTenant;
};

/**
 * The Voice tab's data-fetch + render, shared by `/tenants/[tenantId]/voice` and
 * the slug-free `/dashboard/voice` — both resolve a `TTenant` however fits
 * their own routing (URL param vs. session membership) and hand it here.
 */
export const VoicePageContent = async ({ tenant }: TVoicePageContentProps) => {
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
};

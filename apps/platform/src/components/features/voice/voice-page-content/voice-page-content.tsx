import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { VoiceSettings } from '@platform/components/features/voice/voice-settings';

import { saveVoiceOverridesAction } from './save-voice-overrides-action';

export type TVoicePageContentProps = {
  tenant: TTenant;
};

/**
 * The Voice tab's data-fetch + render, shared by `/tenants/[tenantId]/voice`
 * and `/dashboard/voice` — both resolve a `TTenant` however fits their own
 * routing (URL param vs. session membership) and hand it here.
 */
export const VoicePageContent = async ({ tenant }: TVoicePageContentProps) => {
  const config = await queries.siteConfig.getSiteConfig(tenant.id);

  return (
    <VoiceSettings
      tenantId={tenant.id}
      initialOverrides={config?.voiceOverrides ?? {}}
      saveAction={saveVoiceOverridesAction}
      archivedAt={tenant.deprovisionedAt ?? undefined}
    />
  );
};

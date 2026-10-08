import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { VoiceSettings } from '@platform/components/features/voice/voice-settings';
import { buildVoiceDraft } from '@platform/utils/voice-draft/voice-draft';

import { saveVoiceOverridesAction } from './save-voice-overrides-action';

export type TVoicePageContentProps = {
  tenant: TTenant;
};

export const VoicePageContent = async ({ tenant }: TVoicePageContentProps) => {
  const config = await queries.siteConfig.getSiteConfig(tenant.id);
  const liveLocales = queries.tenants.selectLiveLocales(tenant);

  return (
    <VoiceSettings
      tenantId={tenant.id}
      initialDraft={buildVoiceDraft(
        config?.voiceOverridesByLocale ?? {},
        liveLocales,
      )}
      defaultLocale={tenant.locale}
      liveLocales={liveLocales}
      saveAction={saveVoiceOverridesAction}
      savedAt={config?.updatedAt}
      archivedAt={tenant.deprovisionedAt ?? undefined}
    />
  );
};

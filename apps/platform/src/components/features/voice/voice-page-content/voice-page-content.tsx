import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import { VoiceSettings } from '@platform/components/features/voice/voice-settings';
import { plainTextVoiceOverrides } from '@platform/utils/plain-text-voice-overrides/plain-text-voice-overrides';

import { saveVoiceOverridesAction } from './save-voice-overrides-action';

export type TVoicePageContentProps = {
  tenant: TTenant;
};

export const VoicePageContent = async ({ tenant }: TVoicePageContentProps) => {
  const config = await queries.siteConfig.getSiteConfig(tenant.id);

  return (
    <VoiceSettings
      tenantId={tenant.id}
      locale={tenant.locale}
      initialOverrides={plainTextVoiceOverrides(config?.voiceOverrides ?? {})}
      saveAction={saveVoiceOverridesAction}
      savedAt={config?.updatedAt}
      archivedAt={tenant.deprovisionedAt ?? undefined}
    />
  );
};

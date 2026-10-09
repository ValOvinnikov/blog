import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';
import type { TVoiceListSamples } from '@platform/components/features/site-preview/voice-specimen';
import { VoiceListSamplesProvider } from '@platform/components/features/voice/voice-list-samples-provider';
import { VoiceSettings } from '@platform/components/features/voice/voice-settings';
import {
  defaultLookFormValues,
  toLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import { buildVoiceDraft } from '@platform/utils/voice-draft/voice-draft';
import { getTranslations } from 'next-intl/server';

import { saveVoiceOverridesAction } from './save-voice-overrides-action';

export type TVoicePageContentProps = {
  tenant: TTenant;
};

export const VoicePageContent = async ({ tenant }: TVoicePageContentProps) => {
  const config = await queries.siteConfig.getSiteConfig(tenant.id);
  const liveLocales = queries.tenants.selectLiveLocales(tenant);
  const {
    accentHue,
    logoHue,
    headingFont,
    bodyFont,
    radiusScale,
    density,
    cardStyle,
  } = config ? toLookFormValues(config) : defaultLookFormValues();
  const listSamplesByLocale = Object.fromEntries(
    await Promise.all(
      liveLocales.map(async (locale) => {
        const t = await getTranslations({ locale, namespace: 'voiceSpecimen' });
        return [locale, t.raw('lists') as TVoiceListSamples] as const;
      }),
    ),
  );

  return (
    <VoiceListSamplesProvider samplesByLocale={listSamplesByLocale}>
      <VoiceSettings
        tenantId={tenant.id}
        initialDraft={buildVoiceDraft(
          config?.voiceOverridesByLocale ?? {},
          liveLocales,
        )}
        defaultLocale={tenant.locale}
        liveLocales={liveLocales}
        previewTheme={{
          accentHue,
          logoHue,
          headingFont,
          bodyFont,
          radiusScale,
          density,
          cardStyle,
        }}
        saveAction={saveVoiceOverridesAction}
        savedAt={config?.updatedAt}
        archivedAt={tenant.deprovisionedAt ?? undefined}
      />
    </VoiceListSamplesProvider>
  );
};

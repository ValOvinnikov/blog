import { queries } from '@blog/db';
import type { TVoiceListSamples } from '@platform/components/features/site-preview/voice-specimen';
import { VoiceListSamplesProvider } from '@platform/components/features/voice/voice-list-samples-provider';
import { VoiceSettings } from '@platform/components/features/voice/voice-settings';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { lookFormValuesOrDefaults } from '@platform/utils/to-look-form-values/to-look-form-values';
import { buildVoiceDraft } from '@platform/utils/voice-draft-builder/voice-draft-builder';
import { getTranslations } from 'next-intl/server';

export type TVoicePageContentProps = {
  tenant: TPlatformTenant;
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
    headerControlStyle,
    headerControlShape,
    buttonShape,
    navLinkStyle,
  } = lookFormValuesOrDefaults(config);
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
          headerControlStyle,
          headerControlShape,
          buttonShape,
          navLinkStyle,
        }}
        savedAt={config?.updatedAt}
        archivedAt={tenant.archivedAt}
      />
    </VoiceListSamplesProvider>
  );
};

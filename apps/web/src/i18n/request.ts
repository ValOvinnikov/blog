import { PRESET_ID, PRESET_REGISTRY, type TPresetId } from '@blog/config';
import { deepMergePartial } from '@blog/utils';
import { getSiteConfig } from '@web/server/site-config/get-site-config';
import { applyVoiceOverrides } from '@web/utils/apply-voice-overrides';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const base = (await import(`./messages/${locale.toLowerCase()}.json`))
    .default;

  const result = await getSiteConfig();

  let presetId: TPresetId = PRESET_ID.CONSOLE;
  let voiceOverrides: Record<string, string> = {};

  if (result.ok) {
    if (result.data) {
      presetId = result.data.preset;
      voiceOverrides = result.data.voiceOverrides;
    }
  } else {
    console.error(`Error fetching site config: ${result.error}`);
  }

  const withPreset = deepMergePartial(
    base,
    PRESET_REGISTRY[presetId].voicePack,
  );
  const messages = applyVoiceOverrides(withPreset, voiceOverrides);

  return { locale, messages };
});

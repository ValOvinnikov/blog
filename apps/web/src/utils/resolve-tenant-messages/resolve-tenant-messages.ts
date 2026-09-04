import { PRESET_ID, PRESET_REGISTRY, type TPresetId } from '@blog/config';
import { deepMergePartial } from '@blog/utils';
import { getSiteConfig } from '@web/server/site-config/get-site-config';
import { applyVoiceOverrides } from '@web/utils/apply-voice-overrides';
import { logger } from '@web/utils/logger/logger';

/**
 * Applies the tenant's preset voice pack and any per-key voice overrides on
 * top of the base locale messages returned by `getMessages()`. Called from
 * every route that builds its own `NextIntlClientProvider` tree
 * (`[tenant]/[locale]/layout.tsx`, and the root `not-found.tsx`, which renders
 * outside it) — `i18n/request.ts`'s `getRequestConfig` only resolves the
 * base, un-voiced messages since it has no tenant to read.
 */
export const resolveTenantMessages = async (
  base: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const result = await getSiteConfig();

  let presetId: TPresetId = PRESET_ID.CONSOLE;
  let voiceOverrides: Record<string, string> = {};

  if (result.ok) {
    if (result.data) {
      presetId = result.data.preset;
      voiceOverrides = result.data.voiceOverrides;
    }
  } else {
    logger.error('site_config.fetch_failed', { error: result.error });
  }

  const withPreset = deepMergePartial(
    base,
    PRESET_REGISTRY[presetId].voicePack,
  );

  return applyVoiceOverrides(withPreset, voiceOverrides);
};

import type { TVoicePortableText } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';
import {
  resolveVoiceRichFields,
  type TVoiceRichFieldId,
} from '@web/utils/resolve-voice-rich-fields';
import { getMessages } from 'next-intl/server';

/** Voice overrides are authored in the tenant's default locale, so every other locale gets the catalog default. */
export const getVoiceRich = async (
  id: TVoiceRichFieldId,
  tenant?: string,
): Promise<TVoicePortableText> => {
  const [{ locale, defaultLocale }, baseMessages] = await Promise.all([
    getRequestContext(),
    getMessages(),
  ]);

  if (locale !== defaultLocale) {
    return resolveVoiceRichFields({}, baseMessages)[id];
  }

  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error('voice_rich.fetch_failed', { id, error: result.error });
    return resolveVoiceRichFields({}, baseMessages)[id];
  }

  const voiceOverrides = result.data?.voiceOverrides ?? {};

  return resolveVoiceRichFields(voiceOverrides, baseMessages)[id];
};

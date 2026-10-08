import type { TVoicePortableText } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';
import {
  resolveVoiceRichFields,
  type TVoiceRichFieldId,
} from '@web/utils/resolve-voice-rich-fields';
import { getMessages } from 'next-intl/server';

export const getVoiceRich = async (
  id: TVoiceRichFieldId,
  tenant?: string,
): Promise<TVoicePortableText> => {
  const [{ locale }, baseMessages] = await Promise.all([
    getRequestContext(),
    getMessages(),
  ]);
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error('voice_rich.fetch_failed', { id, error: result.error });
    return resolveVoiceRichFields({}, baseMessages)[id];
  }

  const voiceOverrides = result.data?.voiceOverridesByLocale[locale] ?? {};

  return resolveVoiceRichFields(voiceOverrides, baseMessages)[id];
};

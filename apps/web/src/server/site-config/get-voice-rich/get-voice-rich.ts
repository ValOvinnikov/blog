import type { TVoicePortableText } from '@blog/config';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';
import {
  resolveVoiceRichFields,
  type TVoiceRichFieldId,
} from '@web/utils/resolve-voice-rich-fields';
import { getMessages } from 'next-intl/server';


/**
 * Resolves a single RICH voice field for a Server Component — the tenant's
 * stored override where one exists, otherwise the catalog default wrapped
 * as a single paragraph.
 */
export const getVoiceRich = async (
  id: TVoiceRichFieldId,
  tenant?: string,
): Promise<TVoicePortableText> => {
  const [result, baseMessages] = await Promise.all([
    getSiteConfig(tenant),
    getMessages(),
  ]);

  if (!result.ok) {
    logger.error('voice_rich.fetch_failed', { id, error: result.error });
    return resolveVoiceRichFields({}, baseMessages)[id];
  }

  const voiceOverrides = result.data?.voiceOverrides ?? {};

  return resolveVoiceRichFields(voiceOverrides, baseMessages)[id];
};

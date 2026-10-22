import type { TVoicePortableText } from '@blog/config';
import { VOICE_RICH_FETCH_FAILED_EVENT } from '@web/constants/site-config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { logger } from '@web/utils/logger/logger';
import {
  resolveVoiceRichFields,
  type TVoiceRichFieldId,
} from '@web/utils/resolve-voice-rich-fields';
import { getMessages } from 'next-intl/server';

export const getVoiceRich = async (
  id: TVoiceRichFieldId,
): Promise<TVoicePortableText> => {
  const [{ tenantId, locale }, baseMessages] = await Promise.all([
    getRequestContext(),
    getMessages(),
  ]);
  const result = await getSiteConfig(tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER);

  if (!result.ok) {
    logger.error(VOICE_RICH_FETCH_FAILED_EVENT, { id, error: result.error });
    return resolveVoiceRichFields({}, baseMessages)[id];
  }

  const voiceOverrides = result.data?.voiceOverridesByLocale[locale] ?? {};

  return resolveVoiceRichFields(voiceOverrides, baseMessages)[id];
};

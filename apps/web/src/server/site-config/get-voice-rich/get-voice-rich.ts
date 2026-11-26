import type { TVoicePortableText } from '@shinefold/config';
import { SITE_CONFIG_LOG } from '@web/constants/site-config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSiteConfigRow } from '@web/server/site-config/get-site-config-row/get-site-config-row';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
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
  const row = await getSiteConfigRow(
    SITE_CONFIG_LOG.VOICE_RICH_FETCH_FAILED,
    tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER,
    { id },
  );
  const voiceOverrides = row?.voiceOverridesByLocale[locale] ?? {};

  return resolveVoiceRichFields(voiceOverrides, baseMessages)[id];
};

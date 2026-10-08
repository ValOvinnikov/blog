import { SITE_MESSAGES } from '@blog/config';
import type * as TModule from '@web/server/site-config/get-voice-rich/get-voice-rich';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';

export const getVoiceRich = vi.fn<typeof TModule.getVoiceRich>(
  async (id) => resolveVoiceRichFields({}, SITE_MESSAGES)[id],
);

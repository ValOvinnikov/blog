import {
  SITE_MESSAGES_BY_LOCALE,
  type TLocaleIsoCode,
  type TSiteMessages,
  type TVoicePortableText,
} from '@blog/config';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';
import {
  resolveVoiceRichFields,
  type TVoiceRichFieldId,
} from '@web/utils/resolve-voice-rich-fields';

export type TNotFoundMessagesContext = {
  tenant?: string;
  locale: TLocaleIsoCode;
  hasVoiceOverrides: boolean;
};

interface INotFoundMessages {
  messages: TSiteMessages;
  rich: Record<TVoiceRichFieldId, TVoicePortableText>;
}

/** The message tree a `not-found.tsx` boundary renders and builds its metadata from, so the two never disagree. */
export const resolveNotFoundMessages = async ({
  tenant,
  locale,
  hasVoiceOverrides,
}: TNotFoundMessagesContext): Promise<INotFoundMessages> => {
  const baseMessages = SITE_MESSAGES_BY_LOCALE[locale];
  if (!tenant || !hasVoiceOverrides) {
    return {
      messages: baseMessages,
      rich: resolveVoiceRichFields({}, baseMessages),
    };
  }

  const { messages, rich } = await resolveTenantMessages(baseMessages, tenant);
  // Voice overrides only replace string leaves, so the catalog's shape holds.
  return { messages: messages as TSiteMessages, rich };
};

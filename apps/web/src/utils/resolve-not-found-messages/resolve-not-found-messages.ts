import {
  SITE_MESSAGES_BY_LOCALE,
  type TLocaleIsoCode,
  type TSiteMessages,
} from '@blog/config';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';

export type TNotFoundMessagesContext = {
  tenant?: string;
  locale: TLocaleIsoCode;
  hasVoiceOverrides: boolean;
};

/** The message tree a `not-found.tsx` boundary renders and builds its metadata from, so the two never disagree. */
export const resolveNotFoundMessages = async ({
  tenant,
  locale,
  hasVoiceOverrides,
}: TNotFoundMessagesContext): Promise<TSiteMessages> => {
  const baseMessages = SITE_MESSAGES_BY_LOCALE[locale];
  if (!tenant || !hasVoiceOverrides) return baseMessages;

  const { messages } = await resolveTenantMessages(baseMessages, tenant);
  // Voice overrides only replace string leaves, so the catalog's shape holds.
  return messages as TSiteMessages;
};

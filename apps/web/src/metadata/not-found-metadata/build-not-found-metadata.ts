import { LOCALE_ISO_CODES } from '@blog/config';
import {
  resolveNotFoundMessages,
  type TNotFoundMessagesContext,
} from '@web/utils/resolve-not-found-messages';
import type { Metadata } from 'next';
import { createTranslator } from 'next-intl';

const DEFAULT_CONTEXT: TNotFoundMessagesContext = {
  locale: LOCALE_ISO_CODES.EN,
  hasVoiceOverrides: false,
};

export const buildNotFoundMetadata = async (
  context: TNotFoundMessagesContext = DEFAULT_CONTEXT,
): Promise<Metadata> => {
  const { messages } = await resolveNotFoundMessages(context);
  const t = createTranslator({
    locale: context.locale,
    messages,
    namespace: 'notFound',
  });

  return {
    title: t('heading'),
    description: t('supportingText'),
  };
};

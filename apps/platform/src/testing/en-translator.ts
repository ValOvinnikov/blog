import { LOCALE_ISO_CODES } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { createTranslator } from 'next-intl';

const createLooseTranslator = createTranslator as unknown as (config: {
  locale: string;
  messages: typeof messages;
  namespace?: string;
}) => TLooseTranslator;

export const makeEnTranslator = (namespace?: string): TLooseTranslator =>
  createLooseTranslator({ locale: LOCALE_ISO_CODES.EN, messages, namespace });

import type { LOCALE_ISO_CODES } from '@blog/config/constants';

import DE from './site-messages.de.json';
import SITE_MESSAGES from './site-messages.en.json';
import ES from './site-messages.es.json';
import FR from './site-messages.fr.json';
import NL from './site-messages.nl.json';

export type TSiteMessages = typeof SITE_MESSAGES;

export const SITE_MESSAGES_BY_LOCALE = {
  EN: SITE_MESSAGES,
  NL,
  FR,
  DE,
  ES,
} satisfies Record<keyof typeof LOCALE_ISO_CODES, TSiteMessages>;

export { SITE_MESSAGES };

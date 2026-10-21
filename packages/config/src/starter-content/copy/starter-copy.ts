import type { TLocaleIsoCode } from '@blog/config/constants';

import DE from './starter-copy.de.json';
import STARTER_COPY from './starter-copy.en.json';
import ES from './starter-copy.es.json';
import FR from './starter-copy.fr.json';
import NL from './starter-copy.nl.json';

export type TStarterCopy = typeof STARTER_COPY;

export const STARTER_COPY_BY_LOCALE = {
  EN: STARTER_COPY,
  NL,
  FR,
  DE,
  ES,
} satisfies Record<TLocaleIsoCode, TStarterCopy>;

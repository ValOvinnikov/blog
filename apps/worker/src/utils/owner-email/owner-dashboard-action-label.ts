import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';

export const OWNER_DASHBOARD_ACTION_LABEL = {
  [LOCALE_ISO_CODES.EN]: 'Open your dashboard',
  [LOCALE_ISO_CODES.NL]: 'Open je dashboard',
  [LOCALE_ISO_CODES.FR]: 'Ouvrir le tableau de bord',
  [LOCALE_ISO_CODES.DE]: 'Dashboard öffnen',
  [LOCALE_ISO_CODES.ES]: 'Abrir el panel',
} satisfies Record<TLocaleIsoCode, string>;

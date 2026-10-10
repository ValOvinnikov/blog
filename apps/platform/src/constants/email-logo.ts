import type { TValueOf } from '@blog/config/utils';

export const EMAIL_LOGO_KIND = {
  SENDER: 'SENDER',
  TEMPLATE: 'TEMPLATE',
} as const;

export type TEmailLogoKind = TValueOf<typeof EMAIL_LOGO_KIND>;

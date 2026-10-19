import type { TValueOf } from '@blog/config/utils';

export const AUTH_APP = {
  SITE: 'SITE',
  PLATFORM: 'PLATFORM',
} as const;

export type TAuthApp = TValueOf<typeof AUTH_APP>;

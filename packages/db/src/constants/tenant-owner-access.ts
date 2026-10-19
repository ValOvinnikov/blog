import type { TValueOf } from '@blog/config/utils';

export const SANITY_LOGIN_PROVIDER = {
  GOOGLE: 'GOOGLE',
  GITHUB: 'GITHUB',
  SANITY: 'SANITY',
} as const;

export type TSanityLoginProvider = TValueOf<typeof SANITY_LOGIN_PROVIDER>;

export const SANITY_PROJECT_ROLE = {
  VIEWER: 'VIEWER',
  EDITOR: 'EDITOR',
  ADMINISTRATOR: 'ADMINISTRATOR',
} as const;

export type TSanityProjectRole = TValueOf<typeof SANITY_PROJECT_ROLE>;

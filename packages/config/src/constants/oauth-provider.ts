import type { TValueOf } from '@shinefold/config/utils';

export const OAUTH_PROVIDER = {
  GITHUB: 'github',
  GOOGLE: 'google',
} as const;

export type TOAuthProvider = TValueOf<typeof OAUTH_PROVIDER>;

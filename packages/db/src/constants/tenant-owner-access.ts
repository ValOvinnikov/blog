import type { TValueOf } from '@blog/config/utils';

export const SANITY_PROJECT_ROLE = {
  VIEWER: 'VIEWER',
  EDITOR: 'EDITOR',
  ADMINISTRATOR: 'ADMINISTRATOR',
} as const;

export type TSanityProjectRole = TValueOf<typeof SANITY_PROJECT_ROLE>;

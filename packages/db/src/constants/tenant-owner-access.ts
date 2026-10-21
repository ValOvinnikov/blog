import type { TValueOf } from '@blog/config/utils';

export const SANITY_PROJECT_ROLE = {
  VIEWER: 'VIEWER',
  EDITOR: 'EDITOR',
  ADMINISTRATOR: 'ADMINISTRATOR',
} as const;

export type TSanityProjectRole = TValueOf<typeof SANITY_PROJECT_ROLE>;

export const TENANT_OWNER_EMAIL = {
  INVITE_HEADS_UP: 'INVITE_HEADS_UP',
  INVITE_NUDGE: 'INVITE_NUDGE',
  SITE_READY: 'SITE_READY',
} as const;

export type TTenantOwnerEmail = TValueOf<typeof TENANT_OWNER_EMAIL>;

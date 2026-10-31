import type { TValueOf } from '@blog/config/utils';

export const OWNER_STUDIO_ACCESS = {
  INVITE_SENT: 'INVITE_SENT',
  ACTIVATING: 'ACTIVATING',
  READY: 'READY',
  STALLED: 'STALLED',
} as const;

export type TOwnerStudioAccess = TValueOf<typeof OWNER_STUDIO_ACCESS>;

export type TPendingOwnerStudioAccess = Exclude<
  TOwnerStudioAccess,
  typeof OWNER_STUDIO_ACCESS.READY
>;

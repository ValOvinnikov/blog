import type { TValueOf } from '@shinefold/config/utils';

export const STUDIO_ACCESS = {
  INVITE_SENT: 'INVITE_SENT',
  ACTIVATING: 'ACTIVATING',
  READY: 'READY',
  STALLED: 'STALLED',
} as const;

export type TStudioAccess = TValueOf<typeof STUDIO_ACCESS>;

export type TPendingStudioAccess = Exclude<
  TStudioAccess,
  typeof STUDIO_ACCESS.READY
>;

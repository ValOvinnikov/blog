import { STUDIO_ACCESS, type TStudioAccess } from '@shinefold/config/constants';
import type { TNullable } from '@shinefold/config/types';
import { OWNER_ACCESS_STALL_AFTER_MS } from '@shinefold/db/constants';

type TStudioAcceptance = {
  inviteAcceptedAt: TNullable<Date>;
  sanityUserId: TNullable<string>;
};

export function hasStudioInviteStalled(
  inviteSentAt: TNullable<Date>,
  now: Date,
): boolean {
  return (
    !!inviteSentAt &&
    now.getTime() - inviteSentAt.getTime() >= OWNER_ACCESS_STALL_AFTER_MS
  );
}

// The worker records acceptance with the Sanity user only after granting administrator; READY must not reopen when that role later changes.
export function studioAccessOf(
  { inviteAcceptedAt, sanityUserId }: TStudioAcceptance,
  isStalled: boolean,
): TStudioAccess {
  if (inviteAcceptedAt && sanityUserId) {
    return STUDIO_ACCESS.READY;
  }
  if (inviteAcceptedAt || sanityUserId) {
    return STUDIO_ACCESS.ACTIVATING;
  }
  return isStalled ? STUDIO_ACCESS.STALLED : STUDIO_ACCESS.INVITE_SENT;
}

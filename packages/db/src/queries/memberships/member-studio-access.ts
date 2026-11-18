import type { TSanityLoginProvider } from '@shinefold/config/constants';
import type { TMaybeUndefined, TNullableRow } from '@shinefold/config/types';
import { memberships } from '@shinefold/db/schema/memberships';

export type TMemberStudioAccess = {
  sanityInviteId: TMaybeUndefined<string>;
  inviteSentAt: TMaybeUndefined<Date>;
  inviteAcceptedAt: TMaybeUndefined<Date>;
  sanityUserId: TMaybeUndefined<string>;
  loginProvider: TMaybeUndefined<TSanityLoginProvider>;
};

export const memberStudioAccessColumns = {
  sanityInviteId: memberships.sanityInviteId,
  inviteSentAt: memberships.sanityInviteSentAt,
  inviteAcceptedAt: memberships.sanityInviteAcceptedAt,
  sanityUserId: memberships.sanityUserId,
  loginProvider: memberships.sanityLoginProvider,
};

export function toMemberStudioAccess(
  row: TNullableRow<TMemberStudioAccess>,
): TMemberStudioAccess {
  return {
    sanityInviteId: row.sanityInviteId ?? undefined,
    inviteSentAt: row.inviteSentAt ?? undefined,
    inviteAcceptedAt: row.inviteAcceptedAt ?? undefined,
    sanityUserId: row.sanityUserId ?? undefined,
    loginProvider: row.loginProvider ?? undefined,
  };
}

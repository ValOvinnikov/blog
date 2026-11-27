import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TPendingMembershipInvite } from '@shinefold/db/queries/membership-invites';
import type { TTenantMember } from '@shinefold/db/queries/memberships';
import { graceEndDate } from '@shinefold/db/utils/grace-end-date/grace-end-date';

export type TTeamSeats = {
  seats: number;
  shownUsed: number;
  isFull: boolean;
  freeSeats: number;
  seatsOver: number;
  graceEndsAt: TMaybeUndefined<Date>;
  lockedCount: number;
  emailsLosingAccess: TMaybeUndefined<string>[];
};

type TTeamSeatsInput = {
  tenant: Pick<TPlatformTenant, 'entitlements' | 'downgradeGraceStartedAt'>;
  members: TTenantMember[];
  invites: TPendingMembershipInvite[];
};

const membersPastSeats = (membersBySeatRank: TTenantMember[], seats: number) =>
  membersBySeatRank.filter(({ lockedAt }, rank) => !lockedAt && rank >= seats);

export const teamSeats = ({
  tenant: { entitlements, downgradeGraceStartedAt },
  members,
  invites,
}: TTeamSeatsInput): TTeamSeats => {
  const { seats } = entitlements;
  const used = members.length + invites.length;
  const lockedCount = members.filter(({ lockedAt }) => lockedAt).length;
  const holding = used - lockedCount;
  const seatsOver = Math.max(holding - seats, 0);
  const graceEndsAt = downgradeGraceStartedAt
    ? graceEndDate(downgradeGraceStartedAt)
    : undefined;

  return {
    seats,
    shownUsed: seatsOver > 0 ? holding : Math.min(used, seats),
    isFull: used >= seats,
    freeSeats: Math.max(seats - used, 0),
    seatsOver,
    graceEndsAt,
    lockedCount,
    emailsLosingAccess: graceEndsAt
      ? membersPastSeats(members, seats).map(({ email }) => email)
      : [],
  };
};

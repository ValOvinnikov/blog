import {
  TEAM_ROW_ACCESS,
  type TTeamRowAccess,
} from '@platform/constants/team-access';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { tenantOwnerStudioAccess } from '@platform/utils/owner-studio-access/owner-studio-access';
import { isPendingStudioAccess } from '@platform/utils/pending-studio-access/pending-studio-access';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TMaybeUndefined } from '@shinefold/config';
import { STUDIO_ACCESS, type TStudioAccess } from '@shinefold/config/constants';
import { MEMBERSHIP_ROLE, type TMembershipRole } from '@shinefold/db/constants';
import type { TPendingMembershipInvite } from '@shinefold/db/queries/membership-invites';
import type { TTenantMember } from '@shinefold/db/queries/memberships';
import { graceEndDate } from '@shinefold/db/utils/grace-end-date/grace-end-date';
import { isSameLocalDay } from '@shinefold/utils/date';

export type TTeamMemberRow = {
  membershipId: string;
  email: TMaybeUndefined<string>;
  role: TMembershipRole;
  joinedAt: Date;
  isJoinedToday: boolean;
  isYou: boolean;
  canRemove: boolean;
  access: TTeamRowAccess;
  canRequestAccess: boolean;
};

export type TTeamInviteRow = {
  inviteId: string;
  email: string;
  role: TMembershipRole;
  invitedAt: Date;
  isInvitedToday: boolean;
};

export type TTeamViewModel = {
  seats: number;
  shownUsed: number;
  isFull: boolean;
  freeSeats: number;
  seatsOver: number;
  graceEndsAt: TMaybeUndefined<Date>;
  hasEditor: boolean;
  members: TTeamMemberRow[];
  invites: TTeamInviteRow[];
};

type TTeamViewModelInput = {
  tenant: TPlatformTenant;
  viewer: TPlatformViewer;
  currentUserId: TMaybeUndefined<string>;
  members: TTenantMember[];
  invites: TPendingMembershipInvite[];
};

const rowAccess = (
  { lockedAt, role, studioAccess }: TTenantMember,
  ownerAccess: TStudioAccess,
): TTeamRowAccess => {
  if (lockedAt) return TEAM_ROW_ACCESS.LOCKED;
  if (role === MEMBERSHIP_ROLE.READER) return TEAM_ROW_ACCESS.NO_ACCESS;
  if (role === MEMBERSHIP_ROLE.OWNER) return ownerAccess;
  return studioAccess ?? STUDIO_ACCESS.ACTIVATING;
};

export const teamViewModel = (
  { tenant, viewer, currentUserId, members, invites }: TTeamViewModelInput,
  now: Date = new Date(),
): TTeamViewModel => {
  const { entitlements, downgradeGraceStartedAt } = tenant;
  const { seats } = entitlements;
  const used = members.length + invites.length;
  const holding =
    members.filter(({ lockedAt }) => !lockedAt).length + invites.length;
  const seatsOver = Math.max(holding - seats, 0);
  const ownerCount = members.filter(
    ({ role }) => role === MEMBERSHIP_ROLE.OWNER,
  ).length;
  const ownerAccess =
    tenantOwnerStudioAccess(tenant, now) ?? STUDIO_ACCESS.READY;
  const mayRequestAccess = viewer.isOwner || viewer.isSuperAdmin;

  return {
    seats,
    shownUsed: seatsOver > 0 ? holding : Math.min(used, seats),
    isFull: used >= seats,
    freeSeats: Math.max(seats - used, 0),
    seatsOver,
    graceEndsAt: downgradeGraceStartedAt
      ? graceEndDate(downgradeGraceStartedAt)
      : undefined,
    hasEditor: members.some(({ role }) => role === MEMBERSHIP_ROLE.EDITOR),
    members: members.map((member) => {
      const { membershipId, email, role, joinedAt, userId } = member;
      const isYou = !viewer.isOperator && userId === currentUserId;
      const access = rowAccess(member, ownerAccess);

      return {
        membershipId,
        email,
        role,
        joinedAt,
        isJoinedToday: isSameLocalDay(joinedAt, now),
        isYou,
        canRemove:
          !isYou && !(role === MEMBERSHIP_ROLE.OWNER && ownerCount <= 1),
        access,
        canRequestAccess:
          mayRequestAccess && !!email && isPendingStudioAccess(access),
      };
    }),
    invites: invites
      .filter(({ role }) => role !== MEMBERSHIP_ROLE.OWNER)
      .map(({ inviteId, email, role, invitedAt }) => ({
        inviteId,
        email,
        role,
        invitedAt,
        isInvitedToday: isSameLocalDay(invitedAt, now),
      })),
  };
};

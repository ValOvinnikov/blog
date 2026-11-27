import {
  TEAM_ROW_ACCESS,
  type TTeamRowAccess,
} from '@platform/constants/team-access';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { tenantOwnerStudioAccess } from '@platform/utils/owner-studio-access/owner-studio-access';
import { isPendingStudioAccess } from '@platform/utils/pending-studio-access/pending-studio-access';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import {
  type TTeamSeats,
  teamSeats,
} from '@platform/utils/team-seats/team-seats';
import type { TMaybeUndefined } from '@shinefold/config';
import { STUDIO_ACCESS, type TStudioAccess } from '@shinefold/config/constants';
import { MEMBERSHIP_ROLE, type TMembershipRole } from '@shinefold/db/constants';
import type { TPendingMembershipInvite } from '@shinefold/db/queries/membership-invites';
import type { TTenantMember } from '@shinefold/db/queries/memberships';
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

export type TTeamViewModel = TTeamSeats & {
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
  const ownerCount = members.filter(
    ({ role }) => role === MEMBERSHIP_ROLE.OWNER,
  ).length;
  const ownerAccess =
    tenantOwnerStudioAccess(tenant, now) ?? STUDIO_ACCESS.READY;
  const mayRequestAccess = viewer.isOwner || viewer.isSuperAdmin;

  return {
    ...teamSeats({ tenant, members, invites }),
    hasEditor: members.some(({ role }) => role === MEMBERSHIP_ROLE.EDITOR),
    members: members.map((member) => {
      const { membershipId, email, role, joinedAt, userId, lockedAt } = member;
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
          !isYou &&
          !lockedAt &&
          !(role === MEMBERSHIP_ROLE.OWNER && ownerCount <= 1),
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

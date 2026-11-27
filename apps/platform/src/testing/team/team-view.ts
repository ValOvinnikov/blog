import {
  mockMembership,
  mockViewer,
} from '@platform/testing/memberships/fixtures';
import { createMockFaker } from '@platform/testing/mock-faker';
import {
  MOCK_INVITE_ID,
  MOCK_JOINED_AT,
  MOCK_MEMBER_EMAIL,
  MOCK_MEMBER_ID,
  mockTenantMember,
} from '@platform/testing/team/fixtures';
import { mockTenant } from '@platform/testing/tenants/mock-tenant';
import type {
  TTeamInviteRow,
  TTeamMemberRow,
  teamViewModel,
  TTeamViewModel,
} from '@platform/utils/team-view-model/team-view-model';
import { STUDIO_ACCESS, TENANT_PLAN } from '@shinefold/config/constants';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';

const teamViewFaker = createMockFaker(7169);

const MOCK_TEAM_OWNER_USER_ID = teamViewFaker.string.uuid();
const MOCK_TEAM_OWNER_EMAIL = teamViewFaker.internet.email().toLowerCase();
export const MOCK_INVITEE_EMAIL = teamViewFaker.internet.email().toLowerCase();

export const mockTeamOwner = () =>
  mockTenantMember({
    membershipId: teamViewFaker.string.uuid(),
    userId: MOCK_TEAM_OWNER_USER_ID,
    email: MOCK_TEAM_OWNER_EMAIL,
    role: MEMBERSHIP_ROLE.OWNER,
  });

export const mockTeamOwnerViewer = () =>
  mockViewer({
    membership: mockMembership({ userId: MOCK_TEAM_OWNER_USER_ID }),
  });

export const mockTeamViewModelInput = (
  overrides: Partial<Parameters<typeof teamViewModel>[0]> = {},
): Parameters<typeof teamViewModel>[0] => ({
  tenant: mockTenant({ plan: TENANT_PLAN.GROWTH }),
  viewer: mockTeamOwnerViewer(),
  currentUserId: MOCK_TEAM_OWNER_USER_ID,
  members: [mockTeamOwner()],
  invites: [],
  ...overrides,
});

export const mockTeamMemberRow = (
  overrides: Partial<TTeamMemberRow> = {},
): TTeamMemberRow => ({
  membershipId: MOCK_MEMBER_ID,
  email: MOCK_MEMBER_EMAIL,
  role: MEMBERSHIP_ROLE.EDITOR,
  joinedAt: MOCK_JOINED_AT,
  isJoinedToday: false,
  isYou: false,
  canRemove: true,
  access: STUDIO_ACCESS.READY,
  canRequestAccess: false,
  ...overrides,
});

export const mockTeamOwnerRow = (): TTeamMemberRow =>
  mockTeamMemberRow({
    membershipId: teamViewFaker.string.uuid(),
    email: MOCK_TEAM_OWNER_EMAIL,
    role: MEMBERSHIP_ROLE.OWNER,
    isYou: true,
    canRemove: false,
  });

export const mockTeamInviteRow = (
  overrides: Partial<TTeamInviteRow> = {},
): TTeamInviteRow => ({
  inviteId: MOCK_INVITE_ID,
  email: MOCK_INVITEE_EMAIL,
  role: MEMBERSHIP_ROLE.EDITOR,
  invitedAt: MOCK_JOINED_AT,
  isInvitedToday: false,
  ...overrides,
});

export const mockTeamViewModel = (
  overrides: Partial<TTeamViewModel> = {},
): TTeamViewModel => ({
  seats: 3,
  shownUsed: 1,
  isFull: false,
  freeSeats: 2,
  seatsOver: 0,
  graceEndsAt: undefined,
  lockedCount: 0,
  emailsLosingAccess: [],
  hasEditor: false,
  members: [mockTeamOwnerRow()],
  invites: [],
  ...overrides,
});

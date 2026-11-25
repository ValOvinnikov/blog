import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { createMockFaker } from '@platform/testing/mock-faker';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import {
  MEMBERSHIP_INVITE_OUTCOME,
  MEMBERSHIP_REMOVAL_OUTCOME,
  MEMBERSHIP_ROLE,
} from '@shinefold/db/constants';
import type { TPendingMembershipInvite } from '@shinefold/db/queries/membership-invites';
import type {
  TMemberStudioAccessTarget,
  TTenantMember,
} from '@shinefold/db/queries/memberships';
import type { TMembershipInvite } from '@shinefold/db/schema/membership-invites';

const teamFaker = createMockFaker(7608);

export const MOCK_MEMBER_EMAIL = teamFaker.internet.email().toLowerCase();
export const MOCK_MEMBER_ID = teamFaker.string.uuid();
export const MOCK_INVITE_ID = teamFaker.string.uuid();
export const MOCK_SANITY_USER_ID = `p${teamFaker.string.alphanumeric(8)}`;
export const MOCK_JOINED_AT = new Date('2026-10-02T09:00:00.000Z');

export const mockTeamDb = async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listTenantMembers: vi.fn(async () => [mockTenantMember()]),
      getMemberStudioIdentity: vi.fn(async () => ({
        email: MOCK_MEMBER_EMAIL,
        sanityUserId: MOCK_SANITY_USER_ID,
      })),
      getMemberStudioAccess: vi.fn(async () => mockMemberStudioAccessTarget()),
      removeMembership: vi.fn(async () => MEMBERSHIP_REMOVAL_OUTCOME.REMOVED),
    },
    membershipInvites: {
      createMembershipInvite: vi.fn(async () => ({
        outcome: MEMBERSHIP_INVITE_OUTCOME.CREATED,
        invite: mockInviteRow(),
      })),
      cancelMembershipInvite: vi.fn(async () => true),
      listPendingMembershipInvites: vi.fn(async () => [mockPendingInvite()]),
    },
  },
});

export const mockTenantMember = (
  overrides: Partial<TTenantMember> = {},
): TTenantMember => ({
  membershipId: MOCK_MEMBER_ID,
  userId: teamFaker.string.uuid(),
  email: MOCK_MEMBER_EMAIL,
  role: MEMBERSHIP_ROLE.EDITOR,
  hasSignedIn: true,
  joinedAt: MOCK_JOINED_AT,
  lockedAt: undefined,
  studioAccess: undefined,
  ...overrides,
});

export const mockPendingInvite = (
  overrides: Partial<TPendingMembershipInvite> = {},
): TPendingMembershipInvite => ({
  inviteId: MOCK_INVITE_ID,
  email: MOCK_MEMBER_EMAIL,
  role: MEMBERSHIP_ROLE.EDITOR,
  invitedAt: MOCK_JOINED_AT,
  ...overrides,
});

export const mockInviteRow = (): TMembershipInvite => ({
  id: MOCK_INVITE_ID,
  tenantId: MOCK_TENANT_ID,
  emailEncrypted: teamFaker.string.alphanumeric(24),
  emailIndex: teamFaker.string.alphanumeric(24),
  emailExactIndex: teamFaker.string.alphanumeric(24),
  role: MEMBERSHIP_ROLE.EDITOR,
  createdAt: MOCK_JOINED_AT,
  consumedAt: null,
});

export const mockMemberStudioAccessTarget = (
  overrides: Partial<TMemberStudioAccessTarget> = {},
): TMemberStudioAccessTarget => ({
  membershipId: MOCK_MEMBER_ID,
  role: MEMBERSHIP_ROLE.EDITOR,
  email: MOCK_MEMBER_EMAIL,
  access: {
    sanityInviteId: undefined,
    inviteSentAt: undefined,
    inviteAcceptedAt: undefined,
    sanityUserId: undefined,
    loginProvider: undefined,
  },
  ...overrides,
});

export const MOCK_SEATS_OVER_ONE_SEAT = 2;

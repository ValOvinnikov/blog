import { faker } from '@faker-js/faker';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import type { TPendingMembershipInvite } from '@shinefold/db/queries/membership-invites';
import type { TTenantMember } from '@shinefold/db/queries/memberships';
import type { TMembershipInvite } from '@shinefold/db/schema/membership-invites';

faker.seed(7608);

export const MOCK_MEMBER_EMAIL = 'anna@example.com';
export const MOCK_MEMBER_ID = faker.string.uuid();
export const MOCK_INVITE_ID = faker.string.uuid();
export const MOCK_SANITY_USER_ID = `p${faker.string.alphanumeric(8)}`;
export const MOCK_JOINED_AT = new Date('2026-10-02T09:00:00.000Z');

export const mockTeamDb = async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listTenantMembers: vi.fn(),
      getMemberStudioIdentity: vi.fn(),
      getMemberStudioAccess: vi.fn(),
      removeMembership: vi.fn(),
    },
    membershipInvites: {
      createMembershipInvite: vi.fn(),
      cancelMembershipInvite: vi.fn(),
      listPendingMembershipInvites: vi.fn(),
    },
  },
});

export const mockTenantMember = (
  overrides: Partial<TTenantMember> = {},
): TTenantMember => ({
  membershipId: MOCK_MEMBER_ID,
  userId: faker.string.uuid(),
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
  emailEncrypted: faker.string.alphanumeric(24),
  emailIndex: faker.string.alphanumeric(24),
  emailExactIndex: faker.string.alphanumeric(24),
  role: MEMBERSHIP_ROLE.EDITOR,
  createdAt: MOCK_JOINED_AT,
  consumedAt: null,
});

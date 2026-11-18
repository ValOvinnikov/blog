import {
  OAUTH_PROVIDER,
  SANITY_PROJECT_ROLE,
} from '@shinefold/config/constants';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import type { TMemberStudioAccessTarget } from '@shinefold/db/queries/memberships';
import type { TMemberStudioAccess } from '@shinefold/db/queries/memberships/member-studio-access';
import type { TSanityAclEntry } from '@shinefold/db/utils/sanity-management-client/sanity-project-access';
import type { TSanityUser } from '@shinefold/db/utils/sanity-management-client/sanity-project-users';
import { createMockFaker } from '@worker/testing/mock-faker';

const mockFaker = createMockFaker(7168);

export const MOCK_MEMBERSHIP_ID = mockFaker.string.uuid();
export const MOCK_MEMBER_EMAIL = mockFaker.internet.email().toLowerCase();
export const MOCK_MEMBER_SANITY_USER_ID = `g${mockFaker.string.alphanumeric(10)}`;
export const MOCK_MEMBER_PROJECT_USER_ID = `p${mockFaker.string.alphanumeric(10)}`;
export const MOCK_MEMBER_INVITE_ID = mockFaker.string.uuid();

const MOCK_NO_MEMBER_ACCESS: TMemberStudioAccess = {
  sanityInviteId: undefined,
  inviteSentAt: undefined,
  inviteAcceptedAt: undefined,
  sanityUserId: undefined,
  loginProvider: undefined,
};

export function mockMemberTarget(
  access: Partial<TMemberStudioAccess> = {},
  overrides: Partial<TMemberStudioAccessTarget> = {},
): TMemberStudioAccessTarget {
  return {
    membershipId: MOCK_MEMBERSHIP_ID,
    role: MEMBERSHIP_ROLE.EDITOR,
    email: MOCK_MEMBER_EMAIL,
    access: { ...MOCK_NO_MEMBER_ACCESS, ...access },
    ...overrides,
  };
}

export function mockSanityMember(
  overrides: Partial<TSanityUser> = {},
): TSanityUser {
  return {
    sanityUserId: MOCK_MEMBER_SANITY_USER_ID,
    profile: {
      id: MOCK_MEMBER_PROJECT_USER_ID,
      email: MOCK_MEMBER_EMAIL,
      provider: OAUTH_PROVIDER.GITHUB,
    },
    ...overrides,
  };
}

export function mockMemberAclEntry(...roleNames: string[]): TSanityAclEntry {
  return {
    projectUserId: MOCK_MEMBER_PROJECT_USER_ID,
    roles: roleNames.map((name) => ({ name })),
    isRobot: false,
  };
}

export const MOCK_MEMBER_VIEWER_ACL = [
  mockMemberAclEntry(SANITY_PROJECT_ROLE.VIEWER),
];

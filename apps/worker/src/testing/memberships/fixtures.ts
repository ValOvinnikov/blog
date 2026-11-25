import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import type { TTenantMember } from '@shinefold/db/queries/memberships';
import { createMockFaker } from '@worker/testing/mock-faker';

const membersFaker = createMockFaker(7938);

export function mockTenantMember(
  overrides: Partial<TTenantMember> = {},
): TTenantMember {
  return {
    membershipId: membersFaker.string.uuid(),
    userId: membersFaker.string.uuid(),
    email: membersFaker.internet.email().toLowerCase(),
    role: MEMBERSHIP_ROLE.EDITOR,
    hasSignedIn: true,
    joinedAt: new Date(0),
    lockedAt: undefined,
    studioAccess: undefined,
    ...overrides,
  };
}

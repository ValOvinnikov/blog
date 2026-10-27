import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { z } from 'zod';

import {
  buildVirtualAdminMembership,
  isVirtualAdminMembership,
} from './build-virtual-admin-membership';

faker.seed(5997);

const MOCK_USER_ID = faker.string.uuid();

describe(buildVirtualAdminMembership, () => {
  let membership: ReturnType<typeof buildVirtualAdminMembership>;

  beforeEach(() => {
    membership = buildVirtualAdminMembership(MOCK_USER_ID, MOCK_TENANT_ID);
  });

  it('builds an OWNER-level membership scoped to the given user and tenant', () => {
    expect(membership.userId).toBe(MOCK_USER_ID);
    expect(membership.tenantId).toBe(MOCK_TENANT_ID);
    expect(membership.role).toBe(MEMBERSHIP_ROLE.OWNER);
  });

  it('uses a non-UUID id so it is visibly not a real membership row', () => {
    expect(z.uuid().safeParse(membership.id).success).toBe(false);
  });
});

describe(isVirtualAdminMembership, () => {
  it('recognises a virtual membership', () => {
    const membership = buildVirtualAdminMembership(
      MOCK_USER_ID,
      MOCK_TENANT_ID,
    );

    expect(isVirtualAdminMembership(membership)).toBe(true);
  });

  it('does not take a stored membership for a virtual one', () => {
    expect(isVirtualAdminMembership(mockMembership())).toBe(false);
  });
});

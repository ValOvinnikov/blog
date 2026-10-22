import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';

import { buildVirtualAdminMembership } from './build-virtual-admin-membership';

describe(buildVirtualAdminMembership, () => {
  let membership: ReturnType<typeof buildVirtualAdminMembership>;

  beforeEach(() => {
    membership = buildVirtualAdminMembership('user-1', TENANT_ID);
  });

  it('builds an OWNER-level membership scoped to the given user and tenant', () => {
    expect(membership.userId).toBe('user-1');
    expect(membership.tenantId).toBe(TENANT_ID);
    expect(membership.role).toBe(MEMBERSHIP_ROLE.OWNER);
  });

  it('uses a non-UUID id so it is visibly not a real membership row', () => {
    expect(membership.id).not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

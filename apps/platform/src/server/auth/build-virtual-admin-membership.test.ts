import { buildVirtualAdminMembership } from './build-virtual-admin-membership';

describe(buildVirtualAdminMembership, () => {
  let membership: ReturnType<typeof buildVirtualAdminMembership>;

  beforeEach(() => {
    membership = buildVirtualAdminMembership('user-1', 'tenant-1');
  });

  it('builds an OWNER-level membership scoped to the given user and tenant', () => {
    expect(membership.userId).toBe('user-1');
    expect(membership.tenantId).toBe('tenant-1');
    expect(membership.role).toBe('OWNER');
  });

  it('uses a non-UUID id so it is visibly not a real membership row', () => {
    expect(membership.id).not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

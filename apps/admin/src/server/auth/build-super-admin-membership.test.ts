import { buildSuperAdminMembership } from './build-super-admin-membership';

describe(buildSuperAdminMembership, () => {
  it('builds an OWNER-level membership scoped to the given user and tenant', () => {
    const membership = buildSuperAdminMembership('user-1', 'tenant-1');

    expect(membership.userId).toBe('user-1');
    expect(membership.tenantId).toBe('tenant-1');
    expect(membership.role).toBe('OWNER');
  });

  it('uses a non-UUID id so it is visibly not a real membership row', () => {
    const membership = buildSuperAdminMembership('user-1', 'tenant-1');

    expect(membership.id).not.toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

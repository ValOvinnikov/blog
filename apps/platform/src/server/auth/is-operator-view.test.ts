import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { buildVirtualAdminMembership } from './build-virtual-admin-membership';
import { isOperatorView } from './is-operator-view';

describe(isOperatorView, () => {
  it('is true for an admin', () => {
    expect(isOperatorView({ admin: mockAdmin() })).toBe(true);
  });

  it('is true for a virtual admin membership', () => {
    const membership = buildVirtualAdminMembership(
      mockAdmin().userId,
      MOCK_TENANT_ID,
    );

    expect(isOperatorView({ membership })).toBe(true);
  });

  it('is false for a real membership', () => {
    expect(isOperatorView({ membership: mockMembership() })).toBe(false);
  });

  it('is false with neither an admin nor a membership', () => {
    expect(isOperatorView({})).toBe(false);
  });
});

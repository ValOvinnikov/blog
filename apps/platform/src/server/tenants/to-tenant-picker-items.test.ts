import { MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { toTenantPickerItems } from './to-tenant-picker-items';

const MOCK_USER_ID = 'user-1';

const tenants = [
  mockTenant({
    id: MOCK_OTHER_TENANT_ID,
    name: MOCK_OTHER_TENANT_NAME,
    plan: TENANT_PLAN.GROWTH,
    deprovisionedAt: MOCK_ARCHIVED_AT,
  }),
  mockTenant(),
];

describe(toTenantPickerItems, () => {
  it('sorts the tenants by name', () => {
    const items = toTenantPickerItems(tenants, []);

    expect(items.map(({ name }) => name)).toEqual([
      MOCK_TENANT_NAME,
      MOCK_OTHER_TENANT_NAME,
    ]);
  });

  it('carries each tenant’s role, plan and archived state', () => {
    const items = toTenantPickerItems(tenants, [
      mockMembership({
        tenantId: MOCK_OTHER_TENANT_ID,
        role: MEMBERSHIP_ROLE.EDITOR,
      }),
    ]);

    expect(items).toContainEqual(
      expect.objectContaining({
        id: MOCK_OTHER_TENANT_ID,
        role: MEMBERSHIP_ROLE.EDITOR,
        plan: TENANT_PLAN.GROWTH,
        isArchived: true,
      }),
    );
  });

  it('leaves the role out for a virtual admin membership', () => {
    const items = toTenantPickerItems(tenants, [
      buildVirtualAdminMembership(MOCK_USER_ID, MOCK_TENANT_ID),
    ]);

    expect(items).toContainEqual(
      expect.objectContaining({ id: MOCK_TENANT_ID, role: undefined }),
    );
  });

  it('leaves out every tenant field the picker does not show', () => {
    const [item] = toTenantPickerItems([mockTenant()], []);

    expect(Object.keys(item ?? {}).toSorted()).toEqual([
      'id',
      'isArchived',
      'name',
      'plan',
      'primaryDomain',
      'role',
    ]);
  });
});

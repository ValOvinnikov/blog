import { faker } from '@faker-js/faker';
import {
  mockOtherPinnedTenant,
  mockPinnedTenant,
  mockThirdPinnedTenant,
} from '@platform/testing/tenants/pinned-tenant';

import { applyPinChange, isArchivedTenant } from './pinned-tenants';

faker.seed(8079);

const MOCK_ARCHIVED_AT = faker.date.past();
const MOCK_BOTH_PINNED = [mockPinnedTenant(), mockOtherPinnedTenant()];

describe(applyPinChange, () => {
  it('adds a pinned tenant in name order', () => {
    const pinned = [mockPinnedTenant(), mockThirdPinnedTenant()];
    const other = mockOtherPinnedTenant();

    const result = applyPinChange(pinned, { tenant: other, isPinned: true });

    expect(result).toEqual([pinned[0], other, pinned[1]]);
  });

  it('removes an unpinned tenant', () => {
    const result = applyPinChange(MOCK_BOTH_PINNED, {
      tenant: mockPinnedTenant(),
      isPinned: false,
    });

    expect(result).toEqual([mockOtherPinnedTenant()]);
  });

  it('does not duplicate a tenant that is already pinned', () => {
    const result = applyPinChange(MOCK_BOTH_PINNED, {
      tenant: mockPinnedTenant(),
      isPinned: true,
    });

    expect(result).toEqual(MOCK_BOTH_PINNED);
  });

  it('does not add an archived tenant', () => {
    const pinned = [mockPinnedTenant()];

    const result = applyPinChange(pinned, {
      tenant: mockOtherPinnedTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
      isPinned: true,
    });

    expect(result).toEqual(pinned);
  });
});

describe(isArchivedTenant, () => {
  it('treats a deprovisioned tenant as archived', () => {
    const isArchived = isArchivedTenant({ deprovisionedAt: MOCK_ARCHIVED_AT });

    expect(isArchived).toBe(true);
  });

  it('treats a tenant never deprovisioned as not archived', () => {
    const isArchived = isArchivedTenant({ deprovisionedAt: null });

    expect(isArchived).toBe(false);
  });
});

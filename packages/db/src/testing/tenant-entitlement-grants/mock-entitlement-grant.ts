import { CAPABILITY } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import type { TResolvableGrant } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export function mockEntitlementGrant(
  overrides: Partial<TResolvableGrant> = {},
): TResolvableGrant {
  return {
    kind: ENTITLEMENT_KIND.CAPABILITY,
    key: CAPABILITY.CONTACT_FORM,
    value: null,
    expiresAt: null,
    revokedAt: null,
    ...overrides,
  };
}

import { CAPABILITY } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import {
  resolveTenantEntitlements,
  type TResolvableGrant,
  type TTenantEntitlements,
} from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

import { MOCK_TENANT_CREATED_AT } from './tenant-identity';

export const mockEntitlementGrant = (
  overrides: Partial<TResolvableGrant> = {},
): TResolvableGrant => ({
  kind: ENTITLEMENT_KIND.CAPABILITY,
  key: CAPABILITY.CONTACT_FORM,
  value: null,
  expiresAt: null,
  revokedAt: null,
  ...overrides,
});

export const mockTenantEntitlements = (
  plan: TTenantPlan,
  grants: readonly TResolvableGrant[] = [],
): TTenantEntitlements =>
  resolveTenantEntitlements(plan, grants, MOCK_TENANT_CREATED_AT);

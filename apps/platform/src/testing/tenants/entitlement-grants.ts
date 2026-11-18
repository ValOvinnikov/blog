import { faker } from '@faker-js/faker';
import { CAPABILITY } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import type { TTenantEntitlementGrant } from '@shinefold/db/schema/tenant-entitlement-grants';
import {
  resolveTenantEntitlements,
  type TResolvableGrant,
  type TTenantEntitlements,
} from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

import { MOCK_TENANT_CREATED_AT, MOCK_TENANT_ID } from './tenant-identity';

export const MOCK_GRANT_ID = faker.string.uuid();

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

export const mockEntitlementGrantRow = (
  overrides: Partial<TTenantEntitlementGrant> = {},
): TTenantEntitlementGrant => ({
  ...mockEntitlementGrant(),
  id: MOCK_GRANT_ID,
  tenantId: MOCK_TENANT_ID,
  note: null,
  grantedBy: null,
  grantedAt: MOCK_TENANT_CREATED_AT,
  revokedBy: null,
  ...overrides,
});

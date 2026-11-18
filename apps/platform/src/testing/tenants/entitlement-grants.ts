import { faker } from '@faker-js/faker';
import { GRANT_STATUS } from '@platform/constants/entitlement-grant';
import { createMockFaker } from '@platform/testing/mock-faker';
import type {
  TGrantAccess,
  TGrantTarget,
} from '@platform/utils/grant-target/grant-target';
import type { TGrantRow } from '@platform/utils/to-grant-rows/to-grant-rows';
import { CAPABILITY } from '@shinefold/config';
import { TENANT_PLAN, type TTenantPlan } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import type { TListedEntitlementGrant } from '@shinefold/db/queries/tenant-entitlement-grants';
import type { TTenantEntitlementGrant } from '@shinefold/db/schema/tenant-entitlement-grants';
import {
  resolveTenantEntitlements,
  type TResolvableGrant,
  type TTenantEntitlements,
} from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

import {
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from './tenant-identity';

export const MOCK_GRANT_ID = faker.string.uuid();

const grantFaker = createMockFaker(6783);

export const MOCK_GRANTED_BY_EMAIL = grantFaker.internet.email();
export const MOCK_GRANT_NOTE = grantFaker.lorem.sentence();

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

export const mockGrantTarget = (
  overrides: Partial<TGrantTarget> = {},
): TGrantTarget => ({
  tenantId: MOCK_TENANT_ID,
  tenantName: MOCK_TENANT_NAME,
  plan: TENANT_PLAN.STARTER,
  ...overrides,
});

export const mockGrantAccess = <TKey extends string>(
  overrides: Partial<TGrantAccess<TKey>> = {},
): TGrantAccess<TKey> => ({
  target: undefined,
  granted: {},
  ...overrides,
});

export const mockListedEntitlementGrant = (
  overrides: Partial<TListedEntitlementGrant> = {},
): TListedEntitlementGrant => ({
  ...mockEntitlementGrantRow(),
  grantedByEmail: MOCK_GRANTED_BY_EMAIL,
  ...overrides,
});

export const mockGrantRow = (overrides: Partial<TGrantRow> = {}): TGrantRow => {
  const { id, kind, key, value, note, grantedByEmail, grantedAt, expiresAt } =
    mockListedEntitlementGrant();

  return {
    id,
    kind,
    key,
    value,
    note,
    grantedByEmail,
    grantedAt,
    expiresAt,
    status: GRANT_STATUS.ACTIVE,
    ...overrides,
  };
};

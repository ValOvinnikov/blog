import type { TTenantOwnerMembership } from '@blog/db/queries/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';
import {
  toClientTenant,
  type TClientTenant,
} from '@platform/server/tenants/to-client-tenant';
import {
  DEFAULT_TENANTS_SORT,
  type TTenantsListQuery,
} from '@platform/utils/tenants-list-query/tenants-list-query';

import { mockReadyTenant, mockTenant } from './mock-tenant';
import { MOCK_TENANT_DOMAIN, MOCK_TENANT_NAME } from './tenant-identity';

export * from './mock-tenant';
export * from './provisioning-steps';
export * from './tenant-identity';

export const MOCK_TENANT_URL = `https://${MOCK_TENANT_DOMAIN}`;
export const MOCK_VERCEL_A_RECORD = '76.76.21.21';
export const MOCK_OTHER_TENANT_ID = faker.string.uuid();
export const MOCK_OTHER_TENANT_NAME = 'Globex Corp.';
export const MOCK_OTHER_TENANT_DOMAIN = 'globex.example.org';
export const MOCK_SITE_NAME = 'Northwind Field Notes';
export const MOCK_CUSTOM_DOMAIN = 'northwind.example.dev';
export const MOCK_CUSTOM_DOMAIN_URL = `https://${MOCK_CUSTOM_DOMAIN}`;
export const MOCK_OWNER_EMAIL = 'tenant-owner@example.com';
export const MOCK_INVITED_OWNER_EMAIL = 'invited-owner@example.com';
export const MOCK_NEW_OWNER_EMAIL = 'incoming-owner@example.com';
export const MOCK_RENAMED_TENANT_NAME = 'Acme Renamed';
export const INVITED_PENDING_TEXT = 'Invited, pending';
export const RUN_FINISHED_PENDING_TEXT = '—';
export const MOCK_OWNER_JOINED_AT = new Date('2026-08-12T09:00:00.000Z');
export const MOCK_OWNER_INVITED_AT = new Date('2026-08-10T09:00:00.000Z');

export const mockJoinedOwner = (
  email = MOCK_OWNER_EMAIL,
): TTenantOwnerMembership => ({
  email,
  hasSignedIn: true,
  joinedAt: MOCK_OWNER_JOINED_AT,
});

export const mockInvitedOwner = (
  email = MOCK_INVITED_OWNER_EMAIL,
): TTenantOwnerMembership => ({
  email,
  hasSignedIn: false,
  invitedAt: MOCK_OWNER_INVITED_AT,
});
export const MOCK_ARCHIVED_AT = new Date('2026-08-26T09:00:00.000Z');
export const MOCK_RUN_STARTED_AT = '2026-08-12T14:18:30.000Z';
export const MOCK_RUN_PLUS_1_MIN_AT = '2026-08-12T14:19:30.000Z';
export const MOCK_RUN_PLUS_2_MIN_AT = '2026-08-12T14:20:30.000Z';
export const MOCK_RUN_PLUS_4_MIN_AT = '2026-08-12T14:22:30.000Z';
export const MOCK_RUN_PLUS_6_MIN_AT = '2026-08-12T14:24:30.000Z';
export const MOCK_RUN_PLUS_7_MIN_AT = '2026-08-12T14:25:30.000Z';

export const mockClientTenant = (
  overrides: Partial<TTenant> = {},
): TClientTenant => toClientTenant(mockTenant(overrides));

export const mockReadyClientTenant = (
  overrides: Partial<TTenant> = {},
): TClientTenant => toClientTenant(mockReadyTenant(overrides));

export const mockTenantsListQuery = (
  overrides: Partial<TTenantsListQuery> = {},
): TTenantsListQuery => ({
  shouldShowArchived: false,
  sort: DEFAULT_TENANTS_SORT,
  search: '',
  ...overrides,
});

export const OWNER_EMAIL_LABEL = 'Owner email';
export const PRIMARY_DOMAIN_LABEL = 'Primary domain';
export const REACTIVATE_TENANT_LABEL = 'Reactivate tenant';
export const PLATFORM_TENANT_NOTICE_TEXT =
  "This is the platform's own site, so it can't be suspended or deleted.";
export const CONFIRM_TENANT_NAME_LABEL = `Type "${MOCK_TENANT_NAME}" to confirm`;

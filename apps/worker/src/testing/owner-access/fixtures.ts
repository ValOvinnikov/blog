import type { TTenant } from '@blog/db/schema/tenants';
import type { TSanityInvite } from '@blog/db/utils/sanity-management-client/sanity-project-access';
import type { TSanityUser } from '@blog/db/utils/sanity-management-client/sanity-project-users';
import { SANITY_PENDING_INVITE_STATUS } from '@worker/constants/owner-access';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_SANITY_PROJECT_ID } from '@worker/testing/tenant/fixtures';
import type { TOwnerAccessTarget } from '@worker/utils/owner-access/owner-access-target';

export const MOCK_OWNER_EMAIL = 'owner@example.com';
export const MOCK_MIXED_CASE_OWNER_EMAIL = MOCK_OWNER_EMAIL.toUpperCase();
export const MOCK_INVITE_SENT_AT = '2026-10-20T09:00:00.000Z';
export const MOCK_SANITY_INVITE_ID = 'invite-1';
export const MOCK_OWNER_PROJECT_USER_ID = 'p-owner';
export const MOCK_SANITY_USER_ID = 'g-owner';

export function mockSanityOwner(
  overrides: Partial<TSanityUser['profile']> = {},
): TSanityUser {
  return {
    sanityUserId: MOCK_SANITY_USER_ID,
    profile: {
      id: MOCK_OWNER_PROJECT_USER_ID,
      email: MOCK_OWNER_EMAIL,
      provider: 'google',
      ...overrides,
    },
  };
}

export function mockOwnerAccessTarget(tenant: TTenant): TOwnerAccessTarget {
  return {
    tenant,
    projectId: MOCK_SANITY_PROJECT_ID,
    ownerEmail: MOCK_OWNER_EMAIL,
    env: MOCK_PROVISION_ENV,
  };
}

export function mockPendingInvite(
  overrides: Partial<TSanityInvite> = {},
): TSanityInvite {
  return {
    id: MOCK_SANITY_INVITE_ID,
    email: MOCK_OWNER_EMAIL,
    status: SANITY_PENDING_INVITE_STATUS,
    createdAt: MOCK_INVITE_SENT_AT,
    ...overrides,
  };
}

import type { TTenant } from '@blog/db/schema/tenants';
import type { TSanityUser } from '@blog/db/utils/sanity-management-client/sanity-project-users';
import { getProvisionEnv } from '@worker/testing/provision-env/fake-provision-env';
import type { TOwnerAccessTarget } from '@worker/utils/owner-access/owner-access-target';

export const OWNER_EMAIL = 'owner@example.com';
export const SANITY_PROJECT_ID = 'proj-1';
export const OWNER_PROJECT_USER_ID = 'p-owner';

export function makeSanityOwner(
  overrides: Partial<TSanityUser['profile']> = {},
): TSanityUser {
  return {
    sanityUserId: 'g-owner',
    profile: {
      id: OWNER_PROJECT_USER_ID,
      email: OWNER_EMAIL,
      provider: 'google',
      ...overrides,
    },
  };
}

export function makeOwnerAccessTarget(tenant: TTenant): TOwnerAccessTarget {
  return {
    tenant,
    projectId: SANITY_PROJECT_ID,
    ownerEmail: OWNER_EMAIL,
    env: getProvisionEnv(),
  };
}

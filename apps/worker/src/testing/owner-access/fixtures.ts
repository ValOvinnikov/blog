import type { TSanityUser } from '@blog/db/utils/sanity-management-client/sanity-project-users';

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

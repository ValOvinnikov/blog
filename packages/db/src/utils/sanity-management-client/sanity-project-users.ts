import { HTTP_METHOD, type TSanityProjectRole } from '@blog/config';
import type { TMaybeNull } from '@blog/config/types';
import { SANITY_API_PATH } from '@blog/db/utils/sanity-management-client/sanity-api-paths';
import { sanityAccessRequest } from '@blog/db/utils/sanity-management-client/sanity-api-request';

export type TSanityUser = {
  sanityUserId: string;
  profile: { id: string; email?: string; provider?: string };
  memberships?: Array<{
    resourceType: string;
    resourceId: string;
    roleNames: string[];
    resourceUserId?: TMaybeNull<string>;
  }>;
};

type TSanityUsersPage = {
  data?: TSanityUser[];
  nextCursor?: TMaybeNull<string>;
};

async function listAllSanityUsers(
  path: string,
  token: string,
): Promise<TSanityUser[]> {
  const users: TSanityUser[] = [];
  let cursor: TMaybeNull<string> = null;
  do {
    const query: string = cursor
      ? `?nextCursor=${encodeURIComponent(cursor)}`
      : '';
    const page: TSanityUsersPage = await sanityAccessRequest<TSanityUsersPage>(
      `${path}${query}`,
      token,
    );
    users.push(...(page.data ?? []));
    cursor = page.nextCursor ?? null;
  } while (cursor);
  return users;
}

export function listSanityProjectUsers(input: {
  token: string;
  projectId: string;
}): Promise<TSanityUser[]> {
  return listAllSanityUsers(
    SANITY_API_PATH.projectUsers(input.projectId),
    input.token,
  );
}

export function listSanityOrganizationUsers(input: {
  token: string;
  organizationId: string;
}): Promise<TSanityUser[]> {
  return listAllSanityUsers(
    SANITY_API_PATH.organizationUsers(input.organizationId),
    input.token,
  );
}

// The Access API refuses `administrator`; promote through `grantSanityProjectRole` afterwards.
export async function assignSanityProjectUserRole(input: {
  token: string;
  projectId: string;
  sanityUserId: string;
  role: TSanityProjectRole;
}): Promise<void> {
  await sanityAccessRequest(
    SANITY_API_PATH.projectUserRole(
      input.projectId,
      input.sanityUserId,
      input.role,
    ),
    input.token,
    { method: HTTP_METHOD.PUT },
  );
}

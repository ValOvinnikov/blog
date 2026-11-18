import { SANITY_PROJECT_ROLE } from '@shinefold/config/constants';
import {
  grantSanityProjectRole,
  listSanityProjectAcl,
  revokeSanityProjectRole,
  type TSanityAclEntry,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-access';
import type { TSanityUser } from '@shinefold/db/utils/sanity-management-client/sanity-project-users';
import { sanityRoleChangeToken } from '@shinefold/db/utils/sanity-management-client/sanity-role-change-token';
import { hasLength } from '@shinefold/utils/primitives';

import { findProjectAclEntry } from './find-project-acl-entry';
import type { TStudioProject } from './studio-project';

function rolesBesideAdministrator(entry: TSanityAclEntry): string[] {
  return entry.roles
    .map(({ name }) => name)
    .filter((name) => name !== SANITY_PROJECT_ROLE.ADMINISTRATOR);
}

// Resolves true when the user's roles changed, false when they were already administrator alone.
export async function grantAdministrator(
  project: TStudioProject,
  user: TSanityUser,
): Promise<boolean> {
  const { projectId, token, env } = project;

  const acl = await listSanityProjectAcl({ token, projectId });
  const entry = findProjectAclEntry(acl, user, projectId);
  if (!entry) {
    throw new Error(
      `Sanity user "${user.sanityUserId}" is a project member with no ACL entry yet.`,
    );
  }

  const isAdministrator = entry.roles.some(
    ({ name }) => name === SANITY_PROJECT_ROLE.ADMINISTRATOR,
  );
  const otherRoles = rolesBesideAdministrator(entry);
  if (!isAdministrator) {
    await grantSanityProjectRole({
      token: sanityRoleChangeToken({
        roleName: SANITY_PROJECT_ROLE.ADMINISTRATOR,
        organizationToken: env.sanityManagementToken,
        projectToken: token,
      }),
      projectId,
      projectUserId: entry.projectUserId,
      role: SANITY_PROJECT_ROLE.ADMINISTRATOR,
    });
  }
  for (const name of otherRoles) {
    await revokeSanityProjectRole({
      token,
      projectId,
      projectUserId: entry.projectUserId,
      roleName: name,
    });
  }
  return !isAdministrator || hasLength(otherRoles);
}

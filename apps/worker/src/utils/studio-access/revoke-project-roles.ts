import {
  listSanityProjectAcl,
  revokeSanityProjectRole,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-access';
import type { TSanityUser } from '@shinefold/db/utils/sanity-management-client/sanity-project-users';
import { sanityRoleChangeToken } from '@shinefold/db/utils/sanity-management-client/sanity-role-change-token';

import { findProjectAclEntry } from './find-project-acl-entry';
import type { TStudioProject } from './studio-project';

export async function revokeProjectRoles(
  project: TStudioProject,
  users: TSanityUser[],
): Promise<void> {
  const { projectId, token, env } = project;
  const acl = await listSanityProjectAcl({ token, projectId });

  for (const user of users) {
    const entry = findProjectAclEntry(acl, user, projectId);
    if (!entry) continue;
    for (const { name } of entry.roles) {
      await revokeSanityProjectRole({
        token: sanityRoleChangeToken({
          roleName: name,
          organizationToken: env.sanityManagementToken,
          projectToken: token,
        }),
        projectId,
        projectUserId: entry.projectUserId,
        roleName: name,
      });
    }
  }
}

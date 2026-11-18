import { SANITY_PROJECT_ROLE } from '@shinefold/config';
import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  assignSanityProjectUserRole,
  listSanityOrganizationUsers,
  listSanityProjectUsers,
  type TSanityUser,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-users';

import { isSameEmail, type TStudioProject } from './studio-project';

export async function findStudioUser(
  project: TStudioProject,
  email: string,
): Promise<TMaybeUndefined<TSanityUser>> {
  const { env, projectId, token } = project;

  const projectUsers = await listSanityProjectUsers({ token, projectId });
  const member = projectUsers.find(({ profile }) =>
    isSameEmail(email, profile.email),
  );
  if (member) return member;

  const organizationUsers = await listSanityOrganizationUsers({
    token: env.sanityManagementToken,
    organizationId: env.sanityOrganizationId,
  });
  const organizationUser = organizationUsers.find(({ profile }) =>
    isSameEmail(email, profile.email),
  );
  if (!organizationUser) return undefined;

  await assignSanityProjectUserRole({
    token,
    projectId,
    sanityUserId: organizationUser.sanityUserId,
    role: SANITY_PROJECT_ROLE.VIEWER,
  });
  return organizationUser;
}

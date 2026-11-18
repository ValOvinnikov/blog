import type { TMaybeNull } from '@shinefold/config/types';
import {
  listSanityProjectUsers,
  type TSanityUser,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-users';
import { isTenantOwnerEmail } from '@worker/utils/member-access/member-access-target';
import { getProvisionEnv } from '@worker/utils/provision-env/provision-env';
import { revokeProjectRoles } from '@worker/utils/studio-access/revoke-project-roles';
import {
  deleteInvites,
  listPendingInvites,
} from '@worker/utils/studio-access/studio-invites';
import {
  isSameEmail,
  type TStudioProject,
} from '@worker/utils/studio-access/studio-project';
import { requireTenantManagementToken } from '@worker/utils/tenant-management-token/tenant-management-token';

import { loadTenant } from './run-reported-step';

export type TRemovedMember = {
  email: string;
  sanityUserId?: string;
};

function isRemovedUser(
  removed: TRemovedMember,
  ownerSanityUserId: TMaybeNull<string>,
  user: TSanityUser,
): boolean {
  const { sanityUserId, profile } = user;
  return (
    sanityUserId !== ownerSanityUserId &&
    (isSameEmail(removed.email, profile.email) ||
      sanityUserId === removed.sanityUserId)
  );
}

export async function revokeMemberAccess(
  tenantId: string,
  removed: TRemovedMember,
): Promise<void> {
  const { ownerSanityUserId, sanityProjectId } = await loadTenant(tenantId);
  if (!sanityProjectId) return;
  if (await isTenantOwnerEmail(tenantId, removed.email)) return;

  const project: TStudioProject = {
    projectId: sanityProjectId,
    token: await requireTenantManagementToken(tenantId),
    env: getProvisionEnv(),
  };
  const { projectId, token } = project;
  const [invites, users] = await Promise.all([
    listPendingInvites(project, removed.email),
    listSanityProjectUsers({ token, projectId }),
  ]);

  await deleteInvites(project, invites);
  await revokeProjectRoles(
    project,
    users.filter((user) => isRemovedUser(removed, ownerSanityUserId, user)),
  );
}

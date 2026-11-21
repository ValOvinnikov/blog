import type { TMaybeNull } from '@shinefold/config/types';
import type { TSanityInvite } from '@shinefold/db/utils/sanity-management-client/sanity-project-access';
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
  email?: string;
  sanityUserId?: string;
  sanityInviteId?: string;
};

function isRemovedUser(
  removed: TRemovedMember,
  ownerSanityUserId: TMaybeNull<string>,
  user: TSanityUser,
): boolean {
  const { sanityUserId, profile } = user;
  const { email } = removed;
  return (
    sanityUserId !== ownerSanityUserId &&
    ((!!email && isSameEmail(email, profile.email)) ||
      sanityUserId === removed.sanityUserId)
  );
}

async function listRemovedInvites(
  project: TStudioProject,
  { email, sanityInviteId }: TRemovedMember,
): Promise<TSanityInvite[]> {
  if (email) return listPendingInvites(project, email);
  return sanityInviteId ? [{ id: sanityInviteId }] : [];
}

export async function revokeMemberAccess(
  tenantId: string,
  removed: TRemovedMember,
): Promise<void> {
  const { ownerSanityUserId, sanityProjectId } = await loadTenant(tenantId);
  if (!sanityProjectId) return;
  const { email } = removed;
  if (email && (await isTenantOwnerEmail(tenantId, email))) return;

  const project: TStudioProject = {
    projectId: sanityProjectId,
    token: await requireTenantManagementToken(tenantId),
    env: getProvisionEnv(),
  };
  const { projectId, token } = project;
  const [invites, users] = await Promise.all([
    listRemovedInvites(project, removed),
    listSanityProjectUsers({ token, projectId }),
  ]);

  await deleteInvites(project, invites);
  await revokeProjectRoles(
    project,
    users.filter((user) => isRemovedUser(removed, ownerSanityUserId, user)),
  );
}

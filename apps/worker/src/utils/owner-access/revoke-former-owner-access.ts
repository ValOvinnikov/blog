import type { TMaybeUndefined } from '@blog/config/types';
import { setTenantOwnerAccess } from '@blog/db/queries/tenants';
import {
  deleteSanityProjectInvite,
  listSanityProjectAcl,
  listSanityProjectInvites,
  revokeSanityProjectRole,
  type TSanityInvite,
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import {
  listSanityProjectUsers,
  type TSanityUser,
} from '@blog/db/utils/sanity-management-client/sanity-project-users';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { SANITY_PENDING_INVITE_STATUS } from '@worker/constants/owner-access';

import { hasOwnerEmail, type TOwnerAccessTarget } from './owner-access-target';

function findFormerEmails(
  target: TOwnerAccessTarget,
  invites: TSanityInvite[],
  users: TSanityUser[],
): Set<string> {
  const { ownerSanityInviteId, ownerSanityUserId } = target.tenant;
  const recordedEmails = [
    ownerSanityInviteId &&
      invites.find(({ id }) => id === ownerSanityInviteId)?.email,
    ownerSanityUserId &&
      users.find(({ sanityUserId }) => sanityUserId === ownerSanityUserId)
        ?.profile.email,
  ];
  return new Set(
    recordedEmails.flatMap((email) =>
      email && !hasOwnerEmail(target, email) ? [normalizeEmail(email)] : [],
    ),
  );
}

function isFormerEmail(
  formerEmails: Set<string>,
  email: TMaybeUndefined<string>,
): boolean {
  return !!email && formerEmails.has(normalizeEmail(email));
}

async function revokeFormerRoles(
  target: TOwnerAccessTarget,
  formerUsers: TSanityUser[],
): Promise<void> {
  const { projectId, env } = target;
  const token = env.sanityManagementToken;
  const acl = await listSanityProjectAcl({ token, projectId });

  for (const { profile } of formerUsers) {
    const entry = acl.find(({ projectUserId }) => projectUserId === profile.id);
    for (const { name } of entry?.roles ?? []) {
      await revokeSanityProjectRole({
        token,
        projectId,
        projectUserId: profile.id,
        roleName: name,
      });
    }
  }
}

export async function revokeFormerOwnerAccess(
  target: TOwnerAccessTarget,
): Promise<void> {
  const { tenant, projectId, env } = target;
  if (!tenant.ownerSanityInviteId && !tenant.ownerSanityUserId) return;

  const token = env.sanityManagementToken;
  const [invites, users] = await Promise.all([
    listSanityProjectInvites({ token, projectId }),
    listSanityProjectUsers({ token, projectId }),
  ]);
  const formerEmails = findFormerEmails(target, invites, users);
  if (formerEmails.size === 0) return;

  for (const { id, email, status } of invites) {
    if (
      id &&
      status === SANITY_PENDING_INVITE_STATUS &&
      isFormerEmail(formerEmails, email)
    ) {
      await deleteSanityProjectInvite({ token, projectId, inviteId: id });
    }
  }
  await revokeFormerRoles(
    target,
    users.filter(({ profile }) => isFormerEmail(formerEmails, profile.email)),
  );

  const cleared = await setTenantOwnerAccess(tenant.id, {
    sanityInviteId: null,
    inviteAcceptedAt: null,
    sanityUserId: null,
    loginProvider: null,
    sanityRole: null,
  });
  if (!cleared.ok) {
    throw new Error(
      `Tenant "${tenant.id}"'s former owner access could not be cleared (${cleared.error}).`,
    );
  }
}

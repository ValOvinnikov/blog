import type { TMaybeUndefined } from '@blog/config/types';
import {
  setTenantOwnerAccess,
  type TSetTenantOwnerAccessInput,
} from '@blog/db/queries/tenants';
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
import { hasArrayGotItems } from '@blog/utils/primitives';
import { SANITY_PENDING_INVITE_STATUS } from '@worker/constants/owner-access';

import { findProjectAclEntry } from './find-project-acl-entry';
import { hasOwnerEmail, type TOwnerAccessTarget } from './owner-access-target';

function findFormerEmails(
  target: TOwnerAccessTarget,
  invites: TSanityInvite[],
  users: TSanityUser[],
  formerOwnerEmail: TMaybeUndefined<string>,
): string[] {
  const { ownerSanityInviteId, ownerSanityUserId } = target.tenant;
  const candidateEmails = [
    formerOwnerEmail,
    ownerSanityInviteId &&
      invites.find(({ id }) => id === ownerSanityInviteId)?.email,
    ownerSanityUserId &&
      users.find(({ sanityUserId }) => sanityUserId === ownerSanityUserId)
        ?.profile.email,
  ];
  return [
    ...new Set(
      candidateEmails.flatMap((email) =>
        email && !hasOwnerEmail(target, email) ? [normalizeEmail(email)] : [],
      ),
    ),
  ];
}

function isFormerEmail(
  formerEmails: string[],
  email: TMaybeUndefined<string>,
): boolean {
  return !!email && formerEmails.includes(normalizeEmail(email));
}

async function revokeFormerRoles(
  target: TOwnerAccessTarget,
  formerUsers: TSanityUser[],
): Promise<void> {
  const { projectId, env } = target;
  const token = env.sanityManagementToken;
  const acl = await listSanityProjectAcl({ token, projectId });

  for (const user of formerUsers) {
    const entry = findProjectAclEntry(acl, user, projectId);
    if (!entry) continue;
    for (const { name } of entry.roles) {
      await revokeSanityProjectRole({
        token,
        projectId,
        projectUserId: entry.projectUserId,
        roleName: name,
      });
    }
  }
}

async function clearOwnerAccess(
  tenantId: string,
  access: TSetTenantOwnerAccessInput,
): Promise<void> {
  const cleared = await setTenantOwnerAccess(tenantId, access);
  if (!cleared.ok) {
    throw new Error(
      `Tenant "${tenantId}"'s former owner access could not be cleared (${cleared.error}).`,
    );
  }
}

export async function revokeFormerOwnerAccess(
  target: TOwnerAccessTarget,
  formerOwnerEmail?: string,
): Promise<void> {
  const { tenant, projectId, env } = target;
  const { ownerSanityInviteId, ownerSanityUserId } = tenant;
  if (!ownerSanityInviteId && !ownerSanityUserId && !formerOwnerEmail) return;

  const token = env.sanityManagementToken;
  const [invites, users] = await Promise.all([
    listSanityProjectInvites({ token, projectId }),
    listSanityProjectUsers({ token, projectId }),
  ]);
  const formerEmails = findFormerEmails(
    target,
    invites,
    users,
    formerOwnerEmail,
  );

  if (!hasArrayGotItems(formerEmails)) {
    const isRecordedUserGone =
      !!ownerSanityUserId &&
      !users.some(({ sanityUserId }) => sanityUserId === ownerSanityUserId);
    if (isRecordedUserGone) {
      await clearOwnerAccess(tenant.id, {
        sanityUserId: null,
        loginProvider: null,
        sanityRole: null,
      });
    }
    return;
  }

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

  await clearOwnerAccess(tenant.id, {
    sanityInviteId: null,
    inviteAcceptedAt: null,
    sanityUserId: null,
    loginProvider: null,
    sanityRole: null,
  });
}

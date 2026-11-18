import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  setTenantOwnerAccess,
  type TSetTenantOwnerAccessInput,
} from '@shinefold/db/queries/tenants';
import {
  listSanityProjectInvites,
  type TSanityInvite,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-access';
import {
  listSanityProjectUsers,
  type TSanityUser,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-users';
import { normalizeEmail } from '@shinefold/utils/normalize-email-identity';
import { hasArrayGotItems } from '@shinefold/utils/primitives';
import { revokeProjectRoles } from '@worker/utils/studio-access/revoke-project-roles';
import {
  deleteInvites,
  isPendingInviteFor,
} from '@worker/utils/studio-access/studio-invites';

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
  const { tenant, projectId, token } = target;
  const { ownerSanityInviteId, ownerSanityUserId } = tenant;
  if (!ownerSanityInviteId && !ownerSanityUserId && !formerOwnerEmail) return;

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

  await deleteInvites(
    target,
    invites.filter((invite) =>
      isPendingInviteFor(invite, (email) => isFormerEmail(formerEmails, email)),
    ),
  );
  await revokeProjectRoles(
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

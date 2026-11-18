import { SANITY_PROJECT_ROLE } from '@shinefold/config';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import {
  createSanityProjectInvite,
  deleteSanityProjectInvite,
  listSanityProjectInvites,
  type TSanityInvite,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-access';
import { SANITY_PENDING_INVITE_STATUS } from '@worker/constants/owner-access';

import { isSameEmail, type TStudioProject } from './studio-project';

export function isPendingInviteFor(
  invite: TSanityInvite,
  isInvitee: (email: TMaybeUndefined<string>) => boolean,
): boolean {
  return (
    !!invite.id &&
    invite.status === SANITY_PENDING_INVITE_STATUS &&
    isInvitee(invite.email)
  );
}

export async function listPendingInvites(
  project: TStudioProject,
  email: string,
): Promise<TSanityInvite[]> {
  const { projectId, token } = project;
  const invites = await listSanityProjectInvites({ token, projectId });
  return invites.filter(
    ({ email: invitee, status }) =>
      status === SANITY_PENDING_INVITE_STATUS && isSameEmail(email, invitee),
  );
}

export async function deleteInvites(
  project: TStudioProject,
  invites: TSanityInvite[],
): Promise<void> {
  const { projectId, token } = project;
  for (const { id } of invites) {
    if (id) await deleteSanityProjectInvite({ token, projectId, inviteId: id });
  }
}

async function createViewerInvite(
  project: TStudioProject,
  email: string,
): Promise<TMaybeUndefined<TSanityInvite>> {
  const { projectId, token } = project;
  // The invites endpoint rejects `administrator` with a 403.
  await createSanityProjectInvite({
    token,
    projectId,
    email,
    role: SANITY_PROJECT_ROLE.VIEWER,
  });
  const [invite] = await listPendingInvites(project, email);
  return invite;
}

export async function ensureViewerInvite(
  project: TStudioProject,
  email: string,
  options: { replaceExisting: boolean },
): Promise<{ inviteId: TMaybeNull<string>; inviteSentAt: Date }> {
  const existing = await listPendingInvites(project, email);
  if (options.replaceExisting) await deleteInvites(project, existing);

  const [kept] = options.replaceExisting ? [] : existing;
  const invite = kept ?? (await createViewerInvite(project, email));
  return {
    inviteId: invite?.id ?? null,
    inviteSentAt: invite?.createdAt ? new Date(invite.createdAt) : new Date(),
  };
}

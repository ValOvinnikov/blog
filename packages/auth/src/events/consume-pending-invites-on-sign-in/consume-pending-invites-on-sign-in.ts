import { queries } from '@shinefold/db';

export type TSignInEventUser = {
  id?: string;
  email?: string | null;
};

export async function consumePendingInvitesOnSignIn({
  user,
}: {
  user: TSignInEventUser;
}): Promise<void> {
  const { id: userId, email } = user;
  if (!userId || !email) return;

  try {
    const invites =
      await queries.membershipInvites.findPendingInviteByEmail(email);

    await Promise.all(
      invites.map((invite) =>
        queries.membershipInvites.consumeMembershipInvite(invite.id, userId),
      ),
    );
  } catch {
    // Best-effort like every sign-in event: a missed invite is consumed on the next sign-in.
  }
}

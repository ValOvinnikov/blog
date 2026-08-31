import { queries } from '@blog/db';

export type TSignInEventUser = {
  id?: string;
  email?: string | null;
};

/**
 * Auth.js `events.signIn` handler that attaches a signed-in user's pending membership invites to real `memberships` rows.
 */
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
    // Best-effort: this is invoked as Auth.js's `events.signIn` handler,
    // which has no surrounding try/catch of its own, so an uncaught throw
    // here would fail sign-in for every user, not just invited ones. A
    // missed consumption simply retries on the user's next sign-in — never
    // console.* here, this package never logs (see CLAUDE.md).
  }
}

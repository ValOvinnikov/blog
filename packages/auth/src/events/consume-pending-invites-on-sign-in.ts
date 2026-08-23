import { queries } from '@blog/db';

export type TSignInEventUser = {
  id?: string;
  email?: string | null;
};

/**
 * Auth.js `events.signIn` handler (wired in `config.ts`): attaches every
 * still-pending `membershipInvites` row for the signed-in user's verified
 * email to a real `memberships` row. Fires after every successful sign-in —
 * magic-link, GitHub, or Google, new or already-existing user — which is
 * what lets an already-registered user invited to a second tenant pick up
 * the membership on their next sign-in anywhere, with no separate
 * acceptance flow. Consumption keys on the resolved, verified email, not
 * the provider used to sign in.
 */
export async function consumePendingInvitesOnSignIn({
  user,
}: {
  user: TSignInEventUser;
}): Promise<void> {
  const { id: userId, email } = user;
  if (!userId || !email) return;

  const invites =
    await queries.membershipInvites.findPendingInviteByEmail(email);

  await Promise.all(
    invites.map((invite) =>
      queries.membershipInvites.consumeMembershipInvite(invite.id, userId),
    ),
  );
}

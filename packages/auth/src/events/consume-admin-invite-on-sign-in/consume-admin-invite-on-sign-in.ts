import type { TSignInEventUser } from '@shinefold/auth/events/sign-in-event-user/sign-in-event-user';
import { queries } from '@shinefold/db';

export async function consumeAdminInviteOnSignIn({
  user,
}: {
  user: TSignInEventUser;
}): Promise<void> {
  const { id: userId, email } = user;
  if (!userId || !email) return;

  try {
    await queries.adminInvites.consumeAdminInvite(email, userId);
  } catch {
    // Best-effort like every sign-in event: the invite stays pending and is consumed on the next sign-in.
  }
}

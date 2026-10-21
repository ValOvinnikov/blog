import type { TSignInEventUser } from '@blog/auth/events/consume-pending-invites-on-sign-in';
import {
  SIGNUP_TERMS_COOKIE_NAME,
  TERMS_VERSION,
} from '@blog/config/constants';
import { queries } from '@blog/db';
import { cookies } from 'next/headers';

export async function recordSignupTermsOnSignIn({
  user,
  isNewUser,
}: {
  user: TSignInEventUser;
  isNewUser?: boolean;
}): Promise<void> {
  const { id: userId } = user;
  if (!isNewUser || !userId) return;

  try {
    const acceptedVersion = (await cookies()).get(
      SIGNUP_TERMS_COOKIE_NAME,
    )?.value;
    if (acceptedVersion !== TERMS_VERSION) return;

    await queries.users.recordTermsAcceptance(userId, TERMS_VERSION);
  } catch {
    // Best-effort like every sign-in event: onboarding asks again when no acceptance is recorded.
  }
}

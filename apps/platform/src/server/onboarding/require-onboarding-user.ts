import 'server-only';

import { requireSessionUserId } from '@platform/server/auth/require-session-user-id';
import { resolveUserHomeHref } from '@platform/server/auth/resolve-home-href';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

/** Lets through only a signed-in user with no membership and no `admins` row; everyone else goes to their own home. */
export const requireOnboardingUser = async (): Promise<string> => {
  const userId = await requireSessionUserId();
  const homeHref = await resolveUserHomeHref(userId);

  if (homeHref !== adminRoutes.onboarding()) {
    redirect(homeHref);
  }

  return userId;
};

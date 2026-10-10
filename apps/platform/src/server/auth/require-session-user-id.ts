import 'server-only';

import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

import { getSession } from './auth';

export const requireSessionUserId = async (): Promise<string> => {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(adminRoutes.signIn());
  }

  return userId;
};

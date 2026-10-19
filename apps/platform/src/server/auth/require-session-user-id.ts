import 'server-only';

import { REQUESTED_PATH_HEADER } from '@platform/utils/requested-path/requested-path';
import { adminRoutes } from '@platform/utils/routes/routes';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getSession } from './auth';

export const requireSessionUserId = async (): Promise<string> => {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    const requestedPath = (await headers()).get(REQUESTED_PATH_HEADER);

    redirect(adminRoutes.signIn(requestedPath ?? adminRoutes.home()));
  }

  return userId;
};

import 'server-only';

import type { TMaybeUndefined } from '@shinefold/config';

import { getSession } from './auth';

export const getSessionEmail = async (): Promise<TMaybeUndefined<string>> => {
  const session = await getSession();

  return session?.user?.email ?? undefined;
};

import 'server-only';

import type { TMaybeUndefined } from '@blog/config';

import { getSession } from './auth';

export const getSessionEmail = async (): Promise<TMaybeUndefined<string>> => {
  const session = await getSession();

  return session?.user?.email ?? undefined;
};

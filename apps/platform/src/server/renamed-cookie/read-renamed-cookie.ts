import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { cookies } from 'next/headers';

type TRenamedCookie = {
  name: string;
  legacyName: string;
};

// The legacy name is read but never written: an older stored choice applies until the next one is saved.
export const readRenamedCookie = async ({
  name,
  legacyName,
}: TRenamedCookie): Promise<TMaybeUndefined<string>> => {
  const cookieStore = await cookies();
  return (cookieStore.get(name) ?? cookieStore.get(legacyName))?.value;
};

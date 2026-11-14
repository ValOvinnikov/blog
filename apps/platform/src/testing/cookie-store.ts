import { isUndefined } from '@blog/utils/primitives';
import type { cookies } from 'next/headers';

type TCookieStore = Awaited<ReturnType<typeof cookies>>;

export const cookieStoreWith = (stored: Partial<Record<string, string>>) =>
  ({
    get: (name: string) => {
      const value = stored[name];
      return isUndefined(value) ? undefined : { name, value };
    },
  }) as unknown as TCookieStore;

import type { TMaybeUndefined } from '@blog/config';

export const readCookie = (
  cookieString: string,
  name: string,
): TMaybeUndefined<string> => {
  const prefix = `${name}=`;
  return cookieString
    .split('; ')
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);
};

import type { TMaybeUndefined } from '@blog/config';
import { hasLength } from '@blog/utils/primitives';

export const getDecodedFirstPathSegment = (
  pathname: string,
): TMaybeUndefined<string> => {
  // Decode only the first segment, so an encoded `%2f` can't forge a separator.
  const raw = pathname.split('/').find(hasLength) ?? '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return undefined;
  }
};

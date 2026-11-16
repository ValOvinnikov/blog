import type { TMaybeUndefined } from '@shinefold/config/types';
import { isUndefined } from '@shinefold/utils/primitives';

export const isPlatformAddress = (
  domain: string,
  rootDomain: TMaybeUndefined<string>,
): boolean => !isUndefined(rootDomain) && domain.endsWith(`.${rootDomain}`);

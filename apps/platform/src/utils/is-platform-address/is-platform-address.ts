import type { TMaybeUndefined } from '@blog/config/types';
import { isUndefined } from '@blog/utils/primitives';

export const isPlatformAddress = (
  domain: string,
  rootDomain: TMaybeUndefined<string>,
): boolean => !isUndefined(rootDomain) && domain.endsWith(`.${rootDomain}`);

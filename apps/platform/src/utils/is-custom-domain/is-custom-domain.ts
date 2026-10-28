import type { TMaybeUndefined } from '@blog/config/types';
import { isPlatformAddress } from '@platform/utils/is-platform-address/is-platform-address';

export const isCustomDomain = (
  domain: string,
  rootDomain: TMaybeUndefined<string>,
): boolean => !isPlatformAddress(domain, rootDomain);

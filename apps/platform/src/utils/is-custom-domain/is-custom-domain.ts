import { isPlatformAddress } from '@platform/utils/is-platform-address/is-platform-address';
import type { TMaybeUndefined } from '@shinefold/config/types';

export const isCustomDomain = (
  domain: string,
  rootDomain: TMaybeUndefined<string>,
): boolean => !isPlatformAddress(domain, rootDomain);

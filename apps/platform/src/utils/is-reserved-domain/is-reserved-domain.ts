import type { TMaybeUndefined } from '@blog/config/types';
import { isPlatformAddress } from '@platform/utils/is-platform-address/is-platform-address';

export const isReservedDomain = (
  domain: string,
  rootDomain: string,
  appUrls: TMaybeUndefined<string>[],
): boolean =>
  domain === rootDomain ||
  isPlatformAddress(domain, rootDomain) ||
  appUrls.some((url) => url !== undefined && new URL(url).hostname === domain);

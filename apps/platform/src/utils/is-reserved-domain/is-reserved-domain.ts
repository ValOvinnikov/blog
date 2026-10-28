import { isPlatformAddress } from '@platform/utils/is-platform-address/is-platform-address';

export const isReservedDomain = (
  domain: string,
  rootDomain: string,
  appUrls: string[],
): boolean =>
  domain === rootDomain ||
  isPlatformAddress(domain, rootDomain) ||
  appUrls.some((url) => new URL(url).hostname === domain);

import type { TMaybeUndefined } from '@blog/config/types';

export const isPlatformAddress = (
  domain: string,
  rootDomain: TMaybeUndefined<string>,
): boolean => rootDomain !== undefined && domain.endsWith(`.${rootDomain}`);

import type { TMaybeUndefined } from '@blog/config';
import type { TPlanEntitlements } from '@blog/db/constants';

export const toPoweredByProductName = (
  { hasPoweredByMark }: TPlanEntitlements,
  productName: TMaybeUndefined<string>,
): TMaybeUndefined<string> => (hasPoweredByMark ? productName : undefined);

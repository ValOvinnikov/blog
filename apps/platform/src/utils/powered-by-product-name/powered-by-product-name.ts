import type { TMaybeUndefined } from '@blog/config';
import { PLAN_ENTITLEMENTS, type TTenantPlan } from '@blog/db/constants';

export const toPoweredByProductName = (
  plan: TTenantPlan,
  productName: TMaybeUndefined<string>,
): TMaybeUndefined<string> =>
  PLAN_ENTITLEMENTS[plan].hasPoweredByMark ? productName : undefined;

import type { TMaybeUndefined } from '@blog/config';
import type { TTenantPlan } from '@blog/config/constants';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';

export const toPoweredByProductName = (
  plan: TTenantPlan,
  productName: TMaybeUndefined<string>,
): TMaybeUndefined<string> =>
  PLAN_ENTITLEMENTS[plan].hasPoweredByMark ? productName : undefined;

import type { TTenantPlan } from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';
import {
  ENTITLEMENT_KIND,
  PLAN_ENTITLEMENTS,
  PLAN_LOCALE_LIMIT,
  PLAN_REGISTRY,
  type TEntitlementKind,
} from '@shinefold/db/constants';
import { isNull, isOneOf } from '@shinefold/utils/primitives';

export type TPlanCoverageItem = {
  kind: TEntitlementKind;
  key: string;
  value: TMaybeNull<number>;
};

export const isCoveredByPlan = (
  plan: TTenantPlan,
  { kind, key, value }: TPlanCoverageItem,
): boolean => {
  const planEntitlements = PLAN_ENTITLEMENTS[plan];

  switch (kind) {
    case ENTITLEMENT_KIND.CAPABILITY:
      return isOneOf(PLAN_REGISTRY[plan], key);
    case ENTITLEMENT_KIND.LOOK_FIELD:
      return isOneOf(planEntitlements.lookFields, key);
    case ENTITLEMENT_KIND.MODULE_PACK:
      return isOneOf(planEntitlements.modulePacks, key);
    case ENTITLEMENT_KIND.LOCALE_LIMIT:
      return !isNull(value) && value <= PLAN_LOCALE_LIMIT[plan];
  }
};

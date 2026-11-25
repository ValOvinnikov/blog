import type { TTenantPlan } from '@shinefold/config/constants';
import {
  ENTITLEMENT_KIND,
  PLAN_ENTITLEMENTS,
  PLAN_LOCALE_LIMIT,
  PLAN_REGISTRY,
} from '@shinefold/db/constants';
import type { TStoredEntitlementItem } from '@shinefold/db/utils/stored-entitlement-item/stored-entitlement-item';
import { isNull, isOneOf } from '@shinefold/utils/primitives';

export const isCoveredByPlan = (
  plan: TTenantPlan,
  { kind, key, value }: TStoredEntitlementItem,
): boolean => {
  const planEntitlements = PLAN_ENTITLEMENTS[plan];

  switch (kind) {
    case ENTITLEMENT_KIND.CAPABILITY:
      return isOneOf(PLAN_REGISTRY[plan], key);
    case ENTITLEMENT_KIND.LOOK_FIELD:
      return isOneOf(planEntitlements.lookFields, key);
    case ENTITLEMENT_KIND.MODULE_PACK:
      return isOneOf(planEntitlements.modulePacks, key);
    case ENTITLEMENT_KIND.PRESET:
      return isOneOf(planEntitlements.unlockedPresets, key);
    case ENTITLEMENT_KIND.LOCALE_LIMIT:
      return !isNull(value) && value <= PLAN_LOCALE_LIMIT[plan];
  }
};

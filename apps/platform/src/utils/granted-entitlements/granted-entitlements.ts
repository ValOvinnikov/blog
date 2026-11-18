import {
  CAPABILITY,
  CAPABILITY_PARENT,
  MODULE_PACK,
  type TCapability,
  type TModulePack,
  type TTenantPlan,
} from '@shinefold/config/constants';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import {
  ENTITLEMENT_KIND,
  LOOK_FIELDS,
  PLAN_ENTITLEMENTS,
  PLAN_LOCALE_LIMIT,
  PLAN_REGISTRY,
  type TLookField,
} from '@shinefold/db/constants';
import {
  isEntitlementGrantActive,
  type TResolvableGrant,
} from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import { isNull, isOneOf } from '@shinefold/utils/primitives';

export type TGrantProvenance = { expiresAt: TMaybeNull<Date> };

export type TGrantedEntitlements = {
  capabilities: Partial<Record<TCapability, TGrantProvenance>>;
  lookFields: Partial<Record<TLookField, TGrantProvenance>>;
  modulePacks: Partial<Record<TModulePack, TGrantProvenance>>;
  localeLimit: TMaybeUndefined<TGrantProvenance>;
};

const CAPABILITIES = Object.values(CAPABILITY);
const MODULE_PACKS = Object.values(MODULE_PACK);

const longestLived = (
  current: TMaybeUndefined<TGrantProvenance>,
  expiresAt: TMaybeNull<Date>,
): TGrantProvenance => {
  if (!current) return { expiresAt };
  if (isNull(current.expiresAt) || isNull(expiresAt))
    return { expiresAt: null };

  return {
    expiresAt: current.expiresAt > expiresAt ? current.expiresAt : expiresAt,
  };
};

const record = <TKey extends string>(
  into: Partial<Record<TKey, TGrantProvenance>>,
  key: TKey,
  expiresAt: TMaybeNull<Date>,
) => {
  into[key] = longestLived(into[key], expiresAt);
};

/** What the grants add beyond the plan, with when each ends; an item the plan already includes is not listed. */
export const grantedEntitlements = (
  plan: TTenantPlan,
  grants: readonly TResolvableGrant[],
  now: Date,
): TGrantedEntitlements => {
  const planEntitlements = PLAN_ENTITLEMENTS[plan];
  const granted: TGrantedEntitlements = {
    capabilities: {},
    lookFields: {},
    modulePacks: {},
    localeLimit: undefined,
  };

  for (const grant of grants) {
    if (!isEntitlementGrantActive(grant, now)) continue;

    const { kind, key, value, expiresAt } = grant;

    if (kind === ENTITLEMENT_KIND.CAPABILITY && isOneOf(CAPABILITIES, key)) {
      const parent = CAPABILITY_PARENT[key];

      for (const capability of parent ? [key, parent] : [key]) {
        if (!PLAN_REGISTRY[plan].includes(capability)) {
          record(granted.capabilities, capability, expiresAt);
        }
      }
    } else if (
      kind === ENTITLEMENT_KIND.LOOK_FIELD &&
      isOneOf(LOOK_FIELDS, key)
    ) {
      if (!planEntitlements.lookFields.includes(key)) {
        record(granted.lookFields, key, expiresAt);
      }
    } else if (
      kind === ENTITLEMENT_KIND.MODULE_PACK &&
      isOneOf(MODULE_PACKS, key)
    ) {
      if (!planEntitlements.modulePacks.includes(key)) {
        record(granted.modulePacks, key, expiresAt);
      }
    } else if (
      kind === ENTITLEMENT_KIND.LOCALE_LIMIT &&
      !isNull(value) &&
      value > PLAN_LOCALE_LIMIT[plan]
    ) {
      granted.localeLimit = longestLived(granted.localeLimit, expiresAt);
    }
  }

  return granted;
};

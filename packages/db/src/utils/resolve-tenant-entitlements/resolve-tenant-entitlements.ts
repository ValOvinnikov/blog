import {
  CAPABILITY,
  CAPABILITY_PARENT,
  GRANTABLE_PRESET_IDS,
  MODULE_PACK,
  type TCapability,
  type TTenantPlan,
} from '@shinefold/config/constants';
import {
  ENTITLEMENT_KIND,
  LOOK_FIELDS,
  PLAN_ENTITLEMENTS,
  PLAN_LOCALE_LIMIT,
  PLAN_REGISTRY,
  type TEntitlementKind,
  type TPlanEntitlements,
} from '@shinefold/db/constants';
import type { TTenantEntitlementGrant } from '@shinefold/db/schema/tenant-entitlement-grants';
import { isNull, isOneOf } from '@shinefold/utils/primitives';

export type TTenantEntitlements = TPlanEntitlements & {
  capabilities: readonly TCapability[];
  localeLimit: number;
};

export type TResolvableGrant = Pick<
  TTenantEntitlementGrant,
  'kind' | 'key' | 'value' | 'expiresAt' | 'revokedAt'
>;

const CAPABILITIES = Object.values(CAPABILITY);
const MODULE_PACKS = Object.values(MODULE_PACK);

export function isEntitlementGrantActive(
  { revokedAt, expiresAt }: Pick<TResolvableGrant, 'expiresAt' | 'revokedAt'>,
  now: Date,
): boolean {
  return isNull(revokedAt) && (isNull(expiresAt) || expiresAt > now);
}

function grantedKeys<T extends string>(
  grants: readonly TResolvableGrant[],
  kind: Exclude<TEntitlementKind, typeof ENTITLEMENT_KIND.LOCALE_LIMIT>,
  vocabulary: readonly T[],
): T[] {
  return grants
    .filter((grant) => grant.kind === kind)
    .map(({ key }) => key)
    .filter((key) => isOneOf(vocabulary, key));
}

function union<T>(...lists: (readonly T[])[]): T[] {
  return [...new Set(lists.flat())];
}

export function resolveTenantEntitlements(
  plan: TTenantPlan,
  grants: readonly TResolvableGrant[],
  now: Date,
): TTenantEntitlements {
  const active = grants.filter((grant) => isEntitlementGrantActive(grant, now));
  const planEntitlements = PLAN_ENTITLEMENTS[plan];
  const grantedCapabilities = grantedKeys(
    active,
    ENTITLEMENT_KIND.CAPABILITY,
    CAPABILITIES,
  );
  const grantedParents = grantedCapabilities.flatMap(
    (capability) => CAPABILITY_PARENT[capability] ?? [],
  );
  const grantedLocaleLimits = active
    .filter((grant) => grant.kind === ENTITLEMENT_KIND.LOCALE_LIMIT)
    .flatMap(({ value }) => value ?? []);

  return {
    ...planEntitlements,
    capabilities: union(
      PLAN_REGISTRY[plan],
      grantedCapabilities,
      grantedParents,
    ),
    localeLimit: Math.max(PLAN_LOCALE_LIMIT[plan], ...grantedLocaleLimits),
    lookFields: union(
      planEntitlements.lookFields,
      grantedKeys(active, ENTITLEMENT_KIND.LOOK_FIELD, LOOK_FIELDS),
    ),
    modulePacks: union(
      planEntitlements.modulePacks,
      grantedKeys(active, ENTITLEMENT_KIND.MODULE_PACK, MODULE_PACKS),
    ),
    unlockedPresets: union(
      planEntitlements.unlockedPresets,
      grantedKeys(active, ENTITLEMENT_KIND.PRESET, GRANTABLE_PRESET_IDS),
    ),
  };
}

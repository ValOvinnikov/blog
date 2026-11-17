import type { TCapability, TModulePack } from '@shinefold/config/constants';
import type { TValueOf } from '@shinefold/config/utils';

import type { TLookField } from './look';

export const ENTITLEMENT_KIND = {
  CAPABILITY: 'CAPABILITY',
  MODULE_PACK: 'MODULE_PACK',
  LOOK_FIELD: 'LOOK_FIELD',
  LOCALE_LIMIT: 'LOCALE_LIMIT',
} as const;

export type TEntitlementKind = TValueOf<typeof ENTITLEMENT_KIND>;

export type TEntitlementGrantKey =
  TCapability | TModulePack | TLookField | typeof ENTITLEMENT_KIND.LOCALE_LIMIT;

export type TEntitlementGrantItem =
  | { kind: typeof ENTITLEMENT_KIND.CAPABILITY; key: TCapability }
  | { kind: typeof ENTITLEMENT_KIND.MODULE_PACK; key: TModulePack }
  | { kind: typeof ENTITLEMENT_KIND.LOOK_FIELD; key: TLookField }
  | { kind: typeof ENTITLEMENT_KIND.LOCALE_LIMIT; value: number };

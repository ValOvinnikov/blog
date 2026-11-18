import type { TMaybeNull } from '@shinefold/config/types';
import {
  ENTITLEMENT_KIND,
  type TEntitlementGrantItem,
  type TEntitlementGrantKey,
  type TEntitlementKind,
} from '@shinefold/db/constants';

export type TStoredEntitlementItem = {
  kind: TEntitlementKind;
  key: TEntitlementGrantKey;
  value: TMaybeNull<number>;
};

export function toStoredEntitlementItem(
  item: TEntitlementGrantItem,
): TStoredEntitlementItem {
  return item.kind === ENTITLEMENT_KIND.LOCALE_LIMIT
    ? { kind: item.kind, key: item.kind, value: item.value }
    : { kind: item.kind, key: item.key, value: null };
}

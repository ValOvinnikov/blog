import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import type { TMaybeNull } from '@shinefold/config';
import {
  CAPABILITY,
  GRANTABLE_PRESET_IDS,
  MODULE_PACK,
} from '@shinefold/config/constants';
import {
  ENTITLEMENT_KIND,
  LOOK_FIELDS,
  type TEntitlementKind,
} from '@shinefold/db/constants';
import { isNull, isOneOf } from '@shinefold/utils/primitives';

export type TGrantItem = {
  kind: TEntitlementKind;
  key: string;
  value: TMaybeNull<number>;
};

type TGrantItemTranslators = {
  tFeature: TLooseTranslator;
  tNames: TLooseTranslator;
};

const CAPABILITIES = Object.values(CAPABILITY);
const MODULE_PACKS = Object.values(MODULE_PACK);
const ADDED_LANGUAGE_OFFSET = 1;

export const toGrantItemLabel = (
  { tFeature, tNames }: TGrantItemTranslators,
  { kind, key, value }: TGrantItem,
): string => {
  if (kind === ENTITLEMENT_KIND.LOCALE_LIMIT) {
    return isNull(value)
      ? tNames('additionalLanguages')
      : tNames('languages', { count: value - ADDED_LANGUAGE_OFFSET });
  }
  if (kind === ENTITLEMENT_KIND.CAPABILITY && isOneOf(CAPABILITIES, key)) {
    return tFeature(`toggleLabel.${key}`);
  }
  if (kind === ENTITLEMENT_KIND.MODULE_PACK && isOneOf(MODULE_PACKS, key)) {
    return tNames(`modulePack.${key}`);
  }
  if (kind === ENTITLEMENT_KIND.PRESET && isOneOf(GRANTABLE_PRESET_IDS, key)) {
    return tNames(`preset.${key}`);
  }
  if (isOneOf(LOOK_FIELDS, key)) return tNames(`lookField.${key}`);

  return key;
};

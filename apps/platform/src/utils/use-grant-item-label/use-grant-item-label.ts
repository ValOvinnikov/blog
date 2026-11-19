import type { TMaybeNull } from '@shinefold/config';
import { CAPABILITY, MODULE_PACK } from '@shinefold/config/constants';
import {
  ENTITLEMENT_KIND,
  LOOK_FIELDS,
  type TEntitlementKind,
} from '@shinefold/db/constants';
import { isNull, isOneOf } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

export type TGrantItem = {
  kind: TEntitlementKind;
  key: string;
  value: TMaybeNull<number>;
};

const CAPABILITIES = Object.values(CAPABILITY);
const MODULE_PACKS = Object.values(MODULE_PACK);
const ADDED_LANGUAGE_OFFSET = 1;

export const useGrantItemLabel = () => {
  const tFeature = useTranslations('featuresSettings');
  const tNames = useTranslations('grantItemNames');

  return ({ kind, key, value }: TGrantItem) => {
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
    if (isOneOf(LOOK_FIELDS, key)) return tNames(`lookField.${key}`);

    return key;
  };
};

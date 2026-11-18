import type { TGrantRow } from '@platform/utils/to-grant-rows/to-grant-rows';
import { CAPABILITY, MODULE_PACK } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND, LOOK_FIELDS } from '@shinefold/db/constants';
import { isNull, isOneOf } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';

const CAPABILITIES = Object.values(CAPABILITY);
const MODULE_PACKS = Object.values(MODULE_PACK);
const ADDED_LANGUAGE_OFFSET = 1;

export const useGrantItemLabel = () => {
  const tFeature = useTranslations('featuresSettings');
  const tNames = useTranslations('grantItemNames');

  return ({ kind, key, value }: Pick<TGrantRow, 'kind' | 'key' | 'value'>) => {
    if (kind === ENTITLEMENT_KIND.LOCALE_LIMIT) {
      return tNames('languages', {
        count: (isNull(value) ? 0 : value) - ADDED_LANGUAGE_OFFSET,
      });
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

import type { TBrandAssetKind } from '@platform/utils/brand-asset-limits/brand-asset-limits';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { toLookFormValuesWithin } from '@platform/utils/look-form-values/look-form-values';
import { LOOK_FIELD } from '@shinefold/db/constants';
import {
  isLookFieldWithin,
  isPresetWithin,
} from '@shinefold/db/utils/effective-look/effective-look';
import type { TTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export type TLookChoices = Omit<TLookFormValues, TBrandAssetKind>;

/** A locked field is a change only when it differs from both the stored value and the preset value shown in its place. */
export const listRefusedLookFields = (
  submitted: TLookChoices,
  stored: TLookFormValues,
  entitlements: Pick<TTenantEntitlements, 'lookFields' | 'unlockedPresets'>,
): (keyof TLookChoices)[] => {
  const shown = toLookFormValuesWithin(
    { ...stored, preset: submitted.preset },
    entitlements,
  );
  const fields = Object.keys(submitted) as (keyof TLookChoices)[];
  const isLockedChange = (field: keyof TLookChoices) =>
    field === LOOK_FIELD.PRESET
      ? !isPresetWithin(submitted.preset, entitlements)
      : !isLookFieldWithin(field, entitlements) &&
        submitted[field] !== shown[field];

  return fields.filter(
    (field) => submitted[field] !== stored[field] && isLockedChange(field),
  );
};

import type { TLookFormContext } from '@platform/components/features/look/look-form-provider';
import type { TLookCard } from '@platform/constants/look-card';
import { isBrandNameTooLong } from '@platform/utils/brand-name/brand-name';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import {
  CARD_FIELDS,
  countChanges,
  isFieldChanged,
} from '@platform/utils/look-form-values/look-form-values';
import {
  applyPresetDefaults,
  isPresetValue,
  switchPreset,
  withPresetValue,
} from '@platform/utils/look-preset/look-preset';
import { isAccentHueAccessible, type TPresetId } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import { LOOK_FIELDS, type TLookField } from '@shinefold/db/constants';
import { isLookFieldEntitled } from '@shinefold/db/utils/effective-look/effective-look';
import type { Dispatch, SetStateAction } from 'react';

type TBuildLookFormContextArgs = Pick<
  TLookFormContext,
  | 'tenantName'
  | 'values'
  | 'updateField'
  | 'accentHueFieldId'
  | 'brandNameFieldId'
  | 'repickKinds'
  | 'brandAssetFieldIds'
  | 'brandImageError'
  | 'isSubmenuPreviewOpen'
  | 'setIsSubmenuPreviewOpen'
  | 'previewDevice'
  | 'setPreviewDevice'
> & {
  savedValues: TLookFormValues;
  setValues: Dispatch<SetStateAction<TLookFormValues>>;
  plan: TTenantPlan;
};

export const buildLookFormContext = ({
  values,
  savedValues,
  setValues,
  plan,
  ...rest
}: TBuildLookFormContextArgs): TLookFormContext => {
  const hasFieldChanged = (field: keyof TLookFormValues) =>
    isFieldChanged(field, values, savedValues);
  const isLocked = (field: TLookField) => !isLookFieldEntitled(field, plan);
  const hasLockedFields = LOOK_FIELDS.some(isLocked);

  return {
    ...rest,
    values,
    isLocked,
    hasLockedFields,
    hasCardChanges: (card: TLookCard) =>
      CARD_FIELDS[card].some(hasFieldChanged),
    hasFieldChanged,
    canResetToPreset:
      !hasLockedFields &&
      countChanges(values, applyPresetDefaults(values.preset, values)) > 0,
    isAccentHueRejected: !isAccentHueAccessible(values.accentHue),
    isBrandNameTooLong: isBrandNameTooLong(values.brandName),
    shownBrandName: values.brandName.trim() || rest.tenantName,
    changePreset: (preset: TPresetId) =>
      setValues((prev) => switchPreset(preset, prev)),
    isPresetValue: (field) => isPresetValue(field, values),
    resetFieldToPreset: (field) =>
      setValues((prev) => withPresetValue(field, prev)),
    resetToPreset: () =>
      setValues((prev) => applyPresetDefaults(prev.preset, prev)),
  };
};

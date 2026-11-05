import { isAccentHueAccessible, type TPresetId } from '@blog/config';
import {
  LOOK_FIELDS,
  TENANT_PLAN,
  type TLookField,
  type TTenantPlan,
} from '@blog/db/constants';
import { isLookFieldEntitled } from '@blog/db/utils/effective-look/effective-look';
import type { TLookFormContext } from '@platform/components/features/look/look-form-provider';
import type { TLookCard } from '@platform/constants/look-card';
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
import type { Dispatch, SetStateAction } from 'react';

type TBuildLookFormContextArgs = Pick<
  TLookFormContext,
  | 'tenantName'
  | 'values'
  | 'updateField'
  | 'accentHueFieldId'
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

  return {
    ...rest,
    values,
    isLocked,
    hasLockedFields: LOOK_FIELDS.some(isLocked),
    hasCardChanges: (card: TLookCard) =>
      CARD_FIELDS[card].some(hasFieldChanged),
    hasFieldChanged,
    canResetToPreset:
      plan !== TENANT_PLAN.FREE &&
      countChanges(values, applyPresetDefaults(values.preset, values)) > 0,
    isAccentHueRejected: !isAccentHueAccessible(values.accentHue),
    changePreset: (preset: TPresetId) =>
      setValues((prev) => switchPreset(preset, prev)),
    isPresetValue: (field) => isPresetValue(field, values),
    resetFieldToPreset: (field) =>
      setValues((prev) => withPresetValue(field, prev)),
    resetToPreset: () =>
      setValues((prev) => applyPresetDefaults(prev.preset, prev)),
  };
};

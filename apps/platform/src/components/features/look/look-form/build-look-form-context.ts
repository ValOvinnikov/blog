import { isAccentHueAccessible, type TPresetId } from '@blog/config';
import type { TTenantPlan } from '@blog/db/constants';
import { isLookFieldEntitled } from '@blog/db/utils/effective-look/effective-look';
import type { TLookFormContext } from '@platform/components/features/look/look-form-provider';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import {
  applyPresetDefaults,
  CARD_FIELDS,
  countChanges,
  isFieldChanged,
  type TLookCardKey,
} from '@platform/utils/look-form-values/look-form-values';
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
}: TBuildLookFormContextArgs): TLookFormContext => ({
  ...rest,
  values,
  isLocked: (field) => !isLookFieldEntitled(field, plan),
  hasCardChanges: (card: TLookCardKey) =>
    CARD_FIELDS[card].some((key) => isFieldChanged(key, values, savedValues)),
  isDivergedFromPreset:
    countChanges(values, applyPresetDefaults(values.preset, values)) > 0,
  isAccentHueRejected: !isAccentHueAccessible(values.accentHue),
  changePreset: (preset: TPresetId) =>
    setValues((prev) => applyPresetDefaults(preset, prev)),
  resetToPreset: () =>
    setValues((prev) => applyPresetDefaults(prev.preset, prev)),
});

import { LookField } from '@platform/components/features/look/look-form/components/look-field';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import { useLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import {
  SegmentedControl,
  type TSegmentedControlProps,
} from '@platform/components/shared/segmented-control';
import type { TSegmentedLayout } from '@platform/constants/segmented-control';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import type { TPresetSeededField } from '@platform/utils/look-preset/look-preset';

type TLookPresetChoiceFieldKey = {
  [TKey in TPresetSeededField]: TLookFormValues[TKey] extends string
    ? TKey
    : never;
}[TPresetSeededField];

export type TLookPresetChoiceFieldProps<
  TField extends TLookPresetChoiceFieldKey,
> = {
  field: TField;
  label: string;
  hint: string;
  options: TSegmentedControlProps<TLookFormValues[TField]>['options'];
  layout?: TSegmentedLayout;
};

export const LookPresetChoiceField = <
  TField extends TLookPresetChoiceFieldKey,
>({
  field,
  label,
  hint,
  options,
  layout,
}: TLookPresetChoiceFieldProps<TField>) => {
  const { values, updateField } = useLookForm();
  const lock = useLookFieldLock(field);

  return (
    <LookField
      field={field}
      label={label}
      hint={hint}
      isGroup={true}
      labelId={lock.labelId}
      growthBadgeId={lock.growthBadgeId}
    >
      <SegmentedControl<TLookFormValues[TField]>
        aria={lock.aria}
        options={options}
        value={values[field]}
        onChange={(value) => updateField(field, value)}
        lock={lock}
        layout={layout}
      />
      <PresetValueButton field={field} fieldLabel={label} />
    </LookField>
  );
};

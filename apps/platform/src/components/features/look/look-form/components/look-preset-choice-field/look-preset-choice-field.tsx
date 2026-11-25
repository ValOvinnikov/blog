import {
  LookChoiceField,
  type TLookChoiceFieldKey,
  type TLookChoiceFieldProps,
} from '@platform/components/features/look/look-form/components/look-choice-field';
import { PresetValueButton } from '@platform/components/features/look/look-form/components/preset-value-button';
import type { TPresetSeededField } from '@platform/utils/look-preset/look-preset';

type TLookPresetChoiceFieldKey = Extract<
  TPresetSeededField,
  TLookChoiceFieldKey
>;

export type TLookPresetChoiceFieldProps<
  TField extends TLookPresetChoiceFieldKey,
> = Omit<TLookChoiceFieldProps<TField>, 'children'>;

export const LookPresetChoiceField = <
  TField extends TLookPresetChoiceFieldKey,
>({
  field,
  label,
  ...rest
}: TLookPresetChoiceFieldProps<TField>) => (
  <LookChoiceField field={field} label={label} {...rest}>
    <PresetValueButton field={field} fieldLabel={label} />
  </LookChoiceField>
);

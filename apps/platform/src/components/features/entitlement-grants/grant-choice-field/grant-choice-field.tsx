'use client';

import { FormField } from '@platform/components/shared/form-field';
import {
  OptionSelect,
  type TOptionSelectProps,
} from '@platform/components/shared/option-select';

export type TGrantChoiceFieldProps<TValue extends string> = Pick<
  TOptionSelectProps<TValue>,
  'options' | 'value' | 'onChange' | 'placeholder'
> & {
  label: string;
  hint?: string;
};

export const GrantChoiceField = <TValue extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  placeholder,
}: TGrantChoiceFieldProps<TValue>) => (
  <FormField label={label} hint={hint}>
    <OptionSelect
      options={options}
      value={value}
      onChange={onChange}
      aria={{ label }}
      placeholder={placeholder}
    />
  </FormField>
);

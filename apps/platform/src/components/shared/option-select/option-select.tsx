'use client';

import { Select } from '@platform/components/shared/select';
import type { AriaAttributes } from 'react';

type TOptionSelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type TOptionSelectProps<TValue extends string> = {
  options: TOptionSelectOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

export const OptionSelect = <TValue extends string>({
  options,
  value,
  onChange,
  isDisabled,
  'aria-describedby': ariaDescribedBy,
}: TOptionSelectProps<TValue>) => {
  const selected = options.find((option) => option.value === value);

  return (
    <Select value={value} onChange={onChange} isDisabled={isDisabled}>
      <Select.Trigger aria-describedby={ariaDescribedBy}>
        {selected?.label}
      </Select.Trigger>
      <Select.Popup>
        {options.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            <Select.ItemText>{option.label}</Select.ItemText>
          </Select.Item>
        ))}
      </Select.Popup>
    </Select>
  );
};

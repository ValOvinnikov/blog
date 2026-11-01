'use client';

import type { TControlAria } from '@blog/config';
import { Select } from '@platform/components/shared/select';

type TOptionSelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type TOptionSelectProps<TValue extends string> = {
  options: TOptionSelectOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  aria?: TControlAria;
  isDisabled?: boolean;
  isLocked?: boolean;
};

export const OptionSelect = <TValue extends string>({
  options,
  value,
  onChange,
  aria,
  isDisabled,
  isLocked,
}: TOptionSelectProps<TValue>) => {
  const selected = options.find((option) => option.value === value);

  return (
    <Select
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
      isLocked={isLocked}
    >
      <Select.Trigger aria={aria} isLocked={isLocked}>
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

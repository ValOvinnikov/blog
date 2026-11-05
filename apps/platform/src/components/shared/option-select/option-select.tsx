'use client';

import type { TControlAria, TMaybeNull } from '@blog/config';
import { Select } from '@platform/components/shared/select';
import type { TSelectAppearance } from '@platform/constants/select-appearance';

type TOptionSelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type TOptionSelectProps<TValue extends string> = {
  options: TOptionSelectOption<TValue>[];
  value: TMaybeNull<TValue>;
  onChange: (value: TValue) => void;
  aria?: TControlAria;
  isDisabled?: boolean;
  isLocked?: boolean;
  appearance?: TSelectAppearance;
  placeholder?: string;
};

export const OptionSelect = <TValue extends string>({
  options,
  value,
  onChange,
  aria,
  isDisabled,
  isLocked,
  appearance,
  placeholder,
}: TOptionSelectProps<TValue>) => {
  const selected = options.find((option) => option.value === value);

  return (
    <Select
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
      isLocked={isLocked}
    >
      <Select.Trigger aria={aria} isLocked={isLocked} appearance={appearance}>
        {selected?.label ?? placeholder}
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

'use client';

import type { TControlAria, TMaybeNull } from '@blog/config';
import type { TDecorativeGlyphProps } from '@platform/components/shared/decorative-glyph';
import { Select } from '@platform/components/shared/select';
import type { TSelectAppearance } from '@platform/constants/select-appearance';

type TOptionSelectOption<TValue extends string> = Pick<
  TDecorativeGlyphProps,
  'glyph'
> & {
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
      <Select.Trigger
        aria={aria}
        isLocked={isLocked}
        appearance={appearance}
        glyph={selected?.glyph}
      >
        {selected?.label ?? placeholder}
      </Select.Trigger>
      <Select.Popup>
        {options.map((option) => (
          <Select.Item
            key={option.value}
            value={option.value}
            glyph={option.glyph}
          >
            <Select.ItemText>{option.label}</Select.ItemText>
          </Select.Item>
        ))}
      </Select.Popup>
    </Select>
  );
};

'use client';

import type { TDecorativeGlyphProps } from '@platform/components/shared/decorative-glyph';
import { Select } from '@platform/components/shared/select';
import type { TSelectAppearance } from '@platform/constants/select-appearance';
import type { TControlAria, TControlLock, TMaybeNull } from '@shinefold/config';
import type { ReactNode } from 'react';

type TOptionSelectOption<TValue extends string> = Pick<
  TDecorativeGlyphProps,
  'glyph'
> & {
  value: TValue;
  label: string;
  isDisabled?: boolean;
  triggerGlyph?: ReactNode;
};

export type TOptionSelectProps<TValue extends string> = {
  options: TOptionSelectOption<TValue>[];
  value: TMaybeNull<TValue>;
  onChange: (value: TValue) => void;
  aria?: TControlAria;
  lock?: TControlLock;
  appearance?: TSelectAppearance;
  placeholder?: string;
};

export const OptionSelect = <TValue extends string>({
  options,
  value,
  onChange,
  aria,
  lock = {},
  appearance,
  placeholder,
}: TOptionSelectProps<TValue>) => {
  const { isDisabled, isLocked } = lock;
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
        glyph={selected?.triggerGlyph ?? selected?.glyph}
      >
        {selected?.label ?? placeholder}
      </Select.Trigger>
      <Select.Popup>
        {options.map((option) => (
          <Select.Item
            key={option.value}
            value={option.value}
            glyph={option.glyph}
            isDisabled={option.isDisabled}
          >
            <Select.ItemText>{option.label}</Select.ItemText>
          </Select.Item>
        ))}
      </Select.Popup>
    </Select>
  );
};

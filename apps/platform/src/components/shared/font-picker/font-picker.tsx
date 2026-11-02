'use client';

import type { TControlAria, TFontChoice } from '@blog/config';
import { Select } from '@platform/components/shared/select';
import { FONT_OPTIONS } from '@platform/config/fonts';

import { fontPickerVariants } from './font-picker-variants';

export type TFontPickerProps = {
  aria?: TControlAria;
  value: TFontChoice;
  onChange: (value: TFontChoice) => void;
  isDisabled?: boolean;
  isLocked?: boolean;
};

export const FontPicker = ({
  aria,
  value,
  onChange,
  isDisabled,
  isLocked,
}: TFontPickerProps) => {
  const { value: valueSlot, itemName } = fontPickerVariants();
  const selectedFont = FONT_OPTIONS[value];

  return (
    <Select
      value={value}
      onChange={onChange}
      isDisabled={isDisabled}
      isLocked={isLocked}
    >
      <Select.Trigger aria={aria} isLocked={isLocked}>
        <span
          className={valueSlot()}
          style={{ fontFamily: selectedFont.fontFamily }}
        >
          {selectedFont.label}
        </span>
      </Select.Trigger>
      <Select.Popup>
        {Object.values(FONT_OPTIONS).map((font) => (
          <Select.Item key={font.value} value={font.value}>
            <Select.ItemText
              className={itemName()}
              style={{ fontFamily: font.fontFamily }}
            >
              {font.label}
            </Select.ItemText>
          </Select.Item>
        ))}
      </Select.Popup>
    </Select>
  );
};

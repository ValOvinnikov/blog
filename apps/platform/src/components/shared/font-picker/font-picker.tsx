'use client';

import type { TFontChoice } from '@blog/config';
import { Select } from '@platform/components/shared/select';
import { FONT_OPTIONS } from '@platform/config/fonts';
import type { AriaAttributes } from 'react';

import { fontPickerVariants } from './font-picker-variants';

export type TFontPickerProps = {
  ariaLabel?: string;
  value: TFontChoice;
  onChange: (value: TFontChoice) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

export const FontPicker = ({
  ariaLabel,
  value,
  onChange,
  isDisabled,
  'aria-describedby': ariaDescribedBy,
}: TFontPickerProps) => {
  const { value: valueSlot, itemName } = fontPickerVariants();
  const selectedFont = FONT_OPTIONS[value];

  return (
    <Select value={value} onChange={onChange} isDisabled={isDisabled}>
      <Select.Trigger ariaLabel={ariaLabel} aria-describedby={ariaDescribedBy}>
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

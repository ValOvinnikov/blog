'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import type { TFontChoice } from '@blog/config';
import { FONT_OPTIONS } from '@platform/config/fonts';
import type { AriaAttributes } from 'react';

import { fontPickerVariants } from './font-picker-variants';

export type TFontPickerProps = {
  ariaLabel: string;
  value: TFontChoice;
  onChange: (value: TFontChoice) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

/**
 * Renders the closed set of five `FONT_CHOICE` options, each in its own
 * loaded webfont — reused for both the heading and body pickers.
 */
export const FontPicker = ({
  ariaLabel,
  value,
  onChange,
  isDisabled,
  'aria-describedby': ariaDescribedBy,
}: TFontPickerProps) => {
  const { root, option, radioRoot, radioIndicator, name } =
    fontPickerVariants();

  return (
    <RadioGroup
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      value={value}
      onValueChange={(next) => onChange(next as TFontChoice)}
      disabled={isDisabled}
      className={root()}
    >
      {Object.values(FONT_OPTIONS).map((font) => (
        <label key={font.value} className={option()}>
          <Radio.Root value={font.value} className={radioRoot()}>
            <Radio.Indicator className={radioIndicator()} />
          </Radio.Root>
          <span className={name()} style={{ fontFamily: font.fontFamily }}>
            {font.label}
          </span>
        </label>
      ))}
    </RadioGroup>
  );
};

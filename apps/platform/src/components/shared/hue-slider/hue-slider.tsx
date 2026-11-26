'use client';

import { Slider } from '@base-ui/react/slider';
import { accentHueGradient } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { HUE_MAX, HUE_MIN } from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';
import type { AriaAttributes } from 'react';

import { hueSliderVariants } from './hue-slider-variants';

type THueSliderName = { ariaLabel: string } | { labelledBy: string };

export type THueSliderProps = {
  id?: string;
  name: THueSliderName;
  value: number;
  onChange: (value: number) => void;
  isDisabled?: boolean;
  isLocked?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
};

export const HueSlider = ({
  id,
  name,
  value,
  onChange,
  isDisabled,
  isLocked = false,
  'aria-describedby': ariaDescribedBy,
}: THueSliderProps) => {
  const t = useTranslations('logoHueField');
  const { root, control, track, thumb } = hueSliderVariants();

  return (
    <Slider.Root
      value={value}
      onValueChange={(next) => {
        const nextValue = Array.isArray(next) ? next[0] : next;
        if (!isLocked && !isUndefined(nextValue)) onChange(nextValue);
      }}
      min={HUE_MIN}
      max={HUE_MAX}
      disabled={isDisabled}
      className={root()}
    >
      <Slider.Control className={control()}>
        <Slider.Track
          className={track()}
          style={{ background: accentHueGradient() }}
        >
          <Slider.Thumb
            id={id}
            aria-label={'ariaLabel' in name ? name.ariaLabel : undefined}
            aria-labelledby={'labelledBy' in name ? name.labelledBy : undefined}
            getAriaValueText={(_formatted, hue) => t('hueValue', { hue })}
            aria-describedby={ariaDescribedBy}
            // Thumb forwards no aria-disabled to the range input it renders.
            inputRef={(input) =>
              input?.setAttribute('aria-disabled', String(isLocked))
            }
            className={thumb()}
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
};

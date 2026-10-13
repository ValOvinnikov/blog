'use client';

import { Slider } from '@base-ui/react/slider';
import { accentHueGradient } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import type { AriaAttributes, CSSProperties } from 'react';

import { hueSliderVariants } from './hue-slider-variants';

const HUE_MIN = 0;
const HUE_MAX = 360;
const TRACK_STYLE: CSSProperties = { background: accentHueGradient() };

export type THueSliderProps = {
  id?: string;
  ariaLabel: string;
  value: number;
  onChange: (value: number) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  className?: string;
};

export const HueSlider = ({
  id,
  ariaLabel,
  value,
  onChange,
  isDisabled,
  'aria-describedby': ariaDescribedBy,
  className,
}: THueSliderProps) => {
  const { root, control, track, thumb } = hueSliderVariants();

  return (
    <Slider.Root
      value={value}
      onValueChange={(next) => {
        const nextValue = Array.isArray(next) ? next[0] : next;
        if (nextValue !== undefined) onChange(nextValue);
      }}
      min={HUE_MIN}
      max={HUE_MAX}
      disabled={isDisabled}
      className={root({ class: className })}
    >
      <Slider.Control className={control()}>
        <Slider.Track
          className={track()}
          style={TRACK_STYLE}
          data-testid="hue-slider-track"
        >
          <Slider.Thumb
            id={id}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            className={thumb()}
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
};

'use client';

import { Slider } from '@base-ui/react/slider';
import type { CSSProperties } from 'react';

import { hueSliderVariants } from './hue-slider-variants';

const HUE_MIN = 0;
const HUE_MAX = 360;

export type THueSliderProps = {
  ariaLabel: string;
  value: number;
  onChange: (value: number) => void;
  isDisabled?: boolean;
  /** The gradient track — callers own the color formula (`accentHueGradient`). */
  trackStyle?: CSSProperties;
  className?: string;
};

/**
 * A single-thumb 0–360° hue slider, used by both the accent and logo hue
 * fields — its own gradient-track formula and follow-accent state live in
 * the caller, this component only carries the drag interaction.
 */
export function HueSlider({
  ariaLabel,
  value,
  onChange,
  isDisabled,
  trackStyle,
  className,
}: THueSliderProps) {
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
        <Slider.Track className={track()} style={trackStyle}>
          <Slider.Thumb aria-label={ariaLabel} className={thumb()} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
}

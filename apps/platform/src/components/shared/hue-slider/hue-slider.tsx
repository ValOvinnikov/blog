'use client';

import { Slider } from '@base-ui/react/slider';
import { HUE_MAX, HUE_MIN } from '@blog/config';
import {
  HUE_SLIDER_TRACK,
  type THueSliderTrack,
} from '@platform/constants/hue-slider';
import { useTranslations } from 'next-intl';
import type { AriaAttributes } from 'react';

import { HUE_SLIDER_TRACK_STYLE } from './hue-slider-tracks';
import { hueSliderVariants } from './hue-slider-variants';

type THueSliderName = { ariaLabel: string } | { labelledBy: string };

export type THueSliderProps = {
  id?: string;
  name: THueSliderName;
  value: number;
  onChange: (value: number) => void;
  isDisabled?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  track?: THueSliderTrack;
};

export const HueSlider = ({
  id,
  name,
  value,
  onChange,
  isDisabled,
  'aria-describedby': ariaDescribedBy,
  track: trackKind = HUE_SLIDER_TRACK.PALETTE,
}: THueSliderProps) => {
  const t = useTranslations('logoHueField');
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
      className={root()}
    >
      <Slider.Control className={control()}>
        <Slider.Track
          className={track()}
          style={HUE_SLIDER_TRACK_STYLE[trackKind]}
        >
          <Slider.Thumb
            id={id}
            aria-label={'ariaLabel' in name ? name.ariaLabel : undefined}
            aria-labelledby={'labelledBy' in name ? name.labelledBy : undefined}
            getAriaValueText={(_formatted, hue) => t('hueValue', { hue })}
            aria-describedby={ariaDescribedBy}
            className={thumb()}
          />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  );
};

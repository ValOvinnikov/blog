import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, Ref } from 'react';

import { sliderTrackVariants } from './slider-track-variants';

export interface ISliderTrackProps
  extends ComponentPropsWithoutRef<'div'>, IWithDataTestId {
  ref?: Ref<HTMLDivElement>;
}

/**
 * SliderTrack — the groove a slider thumb moves along. Carries no background
 * colour of its own: the consumer supplies it (a flat token colour, or a
 * generated gradient such as a hue sweep) via `className`/`style`, so nothing
 * here needs overriding to show it.
 */
export const SliderTrack = ({
  className,
  dataTestId,
  ref,
  ...rest
}: ISliderTrackProps) => (
  <div
    {...rest}
    ref={ref}
    data-testid={dataTestId}
    className={sliderTrackVariants({ class: className })}
  />
);

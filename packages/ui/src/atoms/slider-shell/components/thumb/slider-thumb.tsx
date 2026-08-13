import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, Ref } from 'react';

import { sliderThumbVariants } from './slider-thumb-variants';

export interface ISliderThumbProps
  extends ComponentPropsWithoutRef<'div'>, IWithDataTestId {
  ref?: Ref<HTMLDivElement>;
}

/**
 * SliderThumb — the draggable handle a slider's value is read from. A
 * headless behavior library (e.g. Base UI's `Slider.Thumb`) owns its
 * position, focus, and drag state, driving this shell's look through
 * `data-dragging`/`data-disabled` attributes and an inline position style.
 */
export const SliderThumb = ({
  className,
  dataTestId,
  ref,
  ...rest
}: ISliderThumbProps) => (
  <div
    {...rest}
    ref={ref}
    data-testid={dataTestId}
    className={sliderThumbVariants({ class: className })}
  />
);

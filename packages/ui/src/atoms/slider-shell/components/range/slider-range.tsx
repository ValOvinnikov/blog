import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef, Ref } from 'react';

import { sliderRangeVariants } from './slider-range-variants';

export interface ISliderRangeProps
  extends ComponentPropsWithoutRef<'div'>, IWithDataTestId {
  ref?: Ref<HTMLDivElement>;
}

/**
 * SliderRange — the filled portion of the track between a slider's minimum
 * and its current value. Sized and positioned entirely by the behavior
 * library driving the slider (inline `style`, forwarded through `rest`).
 */
export const SliderRange = ({
  className,
  dataTestId,
  ref,
  ...rest
}: ISliderRangeProps) => (
  <div
    {...rest}
    ref={ref}
    data-testid={dataTestId}
    className={sliderRangeVariants({ class: className })}
  />
);

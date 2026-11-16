import type { TSpinnerStyle } from '@shinefold/config';
import { Spinner } from '@shinefold/ui/components/atoms/spinner';

import { sampleSpinnerVariants } from './sample-spinner-variants';

export type TSampleSpinnerProps = {
  variant: TSpinnerStyle;
  isStill?: boolean;
};

export const SampleSpinner = ({
  variant,
  isStill = false,
}: TSampleSpinnerProps) => (
  <Spinner
    label=""
    variant={variant}
    className={sampleSpinnerVariants({ isStill })}
  />
);

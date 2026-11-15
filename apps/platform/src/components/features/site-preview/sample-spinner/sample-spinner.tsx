import type { TSpinnerStyle } from '@blog/config';
import { Spinner } from '@blog/ui/components/atoms/spinner';

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

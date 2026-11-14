import type { TSpinnerStyle } from '@blog/config';
import { Spinner } from '@blog/ui/components/atoms/spinner';

export type TSampleSpinnerProps = {
  variant: TSpinnerStyle;
};

export const SampleSpinner = ({ variant }: TSampleSpinnerProps) => (
  <Spinner label="" variant={variant} />
);

import type { TSpinnerStyle } from '@shinefold/config';
import { Spinner } from '@shinefold/ui/components/atoms/spinner';

export type TSampleSpinnerProps = {
  variant: TSpinnerStyle;
};

export const SampleSpinner = ({ variant }: TSampleSpinnerProps) => (
  <Spinner label="" variant={variant} />
);

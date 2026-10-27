import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { AriaAttributes } from 'react';

import { spinnerVariants, type TSpinnerVariants } from './spinner-variants';

export type TSpinnerProps = IWithClassName &
  IWithDataTestId & {
    label: string;
    hasLabel?: boolean;
    variant?: TSpinnerVariants['variant'];
    size?: TSpinnerVariants['size'];
    'aria-hidden'?: AriaAttributes['aria-hidden'];
  };

/** The shared indeterminate loading indicator for every async state (a submitting button, a session resolving, a region fetching on demand). */
export const Spinner = ({
  label,
  hasLabel = false,
  variant,
  size,
  className,
  dataTestId,
  'aria-hidden': ariaHidden,
}: TSpinnerProps) => {
  const { root, glyph, text } = spinnerVariants({ variant, size });

  return (
    <span
      role="status"
      aria-label={label}
      aria-hidden={ariaHidden}
      data-testid={dataTestId}
      className={root({ class: className })}
    >
      <span className={glyph()} aria-hidden="true" />
      {hasLabel && (
        <span className={text()} aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
};

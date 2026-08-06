import type { IWithDataTestId } from '@blog/config';
import type { HTMLAttributes } from 'react';

import { spinnerVariants } from './spinner-variants';

export type TSpinnerProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'role' | 'aria-label'
> &
  IWithDataTestId & {
    label: string;
    showLabel?: boolean;
    className?: string;
  };

/**
 * Spinner — the shared indeterminate loading indicator for every async
 * state (a submitting button, a session resolving, a region fetching on
 * demand). Pure CSS: a braille-dot glyph cycles by swapping `::before`
 * content across keyframes, so it needs no client runtime and stays a valid
 * `@blog/ui` atom. The accessible name always comes from `label` via
 * `aria-label` — `role="status"` does not pick up name-from-content, so the
 * glyph itself is `aria-hidden` and `showLabel` only controls whether that
 * same text is *also* rendered visibly beside it.
 */
export const Spinner = ({
  label,
  showLabel = false,
  className,
  dataTestId,
  ...rest
}: TSpinnerProps) => {
  const { root, glyph, text } = spinnerVariants();

  return (
    <span
      {...rest}
      role="status"
      aria-label={label}
      data-testid={dataTestId}
      className={root({ class: className })}
    >
      <span className={glyph()} aria-hidden="true" />
      {showLabel && <span className={text()}>{label}</span>}
    </span>
  );
};

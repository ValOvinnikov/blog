import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { AriaAttributes } from 'react';

import { spinnerVariants, type TSpinnerVariants } from './spinner-variants';

export type TSpinnerProps = IWithClassName &
  IWithDataTestId & {
    label: string;
    showLabel?: boolean;
    size?: TSpinnerVariants['size'];
    'aria-hidden'?: AriaAttributes['aria-hidden'];
  };

/**
 * Spinner — the shared indeterminate loading indicator for every async
 * state (a submitting button, a session resolving, a region fetching on
 * demand). Pure CSS: a braille-dot glyph cycles by swapping `::before`
 * content across keyframes, so it needs no client runtime and stays a valid
 * `@blog/ui` atom. The accessible name always comes from `label` via
 * `aria-label` — `role="status"` does not pick up name-from-content, so the
 * glyph itself is `aria-hidden` and `showLabel` only controls whether that
 * same text is *also* rendered visibly beside it. The visible text is itself
 * `aria-hidden` so it is never announced a second time alongside the root's
 * `aria-label`.
 */
export const Spinner = ({
  label,
  showLabel = false,
  size,
  className,
  dataTestId,
  'aria-hidden': ariaHidden,
}: TSpinnerProps) => {
  const { root, glyph, text } = spinnerVariants({ size });

  return (
    <span
      role="status"
      aria-label={label}
      aria-hidden={ariaHidden}
      data-testid={dataTestId}
      className={root({ class: className })}
    >
      <span className={glyph()} aria-hidden="true" />
      {showLabel && (
        <span className={text()} aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
};

import type { IWithDataTestId } from '@blog/config';
import { type ButtonHTMLAttributes, type Ref } from 'react';

import { iconButtonVariants } from './icon-button-variants';

export interface IIconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, IWithDataTestId {
  ariaLabel: string;
  /** Forwarded to the underlying `<button>` so a caller composing this component (or managing focus directly) can reach the real node. */
  ref?: Ref<HTMLButtonElement>;
}

/** A 22×22 icon-only button. Pass `ariaLabel` — no hardcoded accessible name. */
export const IconButton = ({
  ariaLabel,
  className,
  children,
  dataTestId,
  ref,
  ...rest
}: IIconButtonProps) => (
  <button
    {...rest}
    ref={ref}
    type="button"
    aria-label={ariaLabel}
    data-testid={dataTestId}
    className={iconButtonVariants({ class: className })}
  >
    {children}
  </button>
);

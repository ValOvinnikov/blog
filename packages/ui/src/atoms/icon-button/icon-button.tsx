import type { IWithDataTestId } from '@blog/config';
import { type ButtonHTMLAttributes } from 'react';

import { iconButtonVariants } from './icon-button-variants';

export interface IIconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, IWithDataTestId {
  ariaLabel: string;
}

/** A 22×22 icon-only button. Pass `ariaLabel` — no hardcoded accessible name. */
export const IconButton = ({
  ariaLabel,
  className,
  children,
  dataTestId,
  ...rest
}: IIconButtonProps) => (
  <button
    {...rest}
    type="button"
    aria-label={ariaLabel}
    data-testid={dataTestId}
    className={iconButtonVariants({ class: className })}
  >
    {children}
  </button>
);

import type { IWithDataTestId } from '@blog/config';
import { type ButtonHTMLAttributes } from 'react';

import { buttonVariants, type TButtonVariants } from './button-variants';

export type TButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  TButtonVariants &
  IWithDataTestId;

/**
 * Button — the styled `<button>` for in-page actions (submit, toggle, dismiss).
 * Renders `type="button"` and takes its look from the shared `variant`/`size`
 * scale; reach for `LinkButton` when the control is really a navigation link.
 */
export const Button = ({
  className,
  variant,
  size,
  dataTestId,
  ...rest
}: TButtonProps) => {
  return (
    <button
      {...rest}
      type="button"
      data-testid={dataTestId}
      className={buttonVariants({ variant, size, class: className })}
    />
  );
};

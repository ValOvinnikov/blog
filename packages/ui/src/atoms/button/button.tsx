import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { AriaAttributes, MouseEventHandler, ReactNode } from 'react';

import { buttonVariants, type TButtonVariants } from './button-variants';

export type TButtonProps = IWithClassName &
  IWithDataTestId &
  TButtonVariants & {
    type?: 'button' | 'submit' | 'reset';
    title?: string;
    children?: ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    isDisabled?: boolean;
    'aria-busy'?: AriaAttributes['aria-busy'];
  };

/**
 * Button — the styled `<button>` for in-page actions (submit, toggle, dismiss).
 * Defaults to `type="button"` and takes its look from the shared `variant`/`size`
 * scale; reach for `LinkButton` when the control is really a navigation link.
 */
export const Button = ({
  className,
  variant,
  size,
  dataTestId,
  type = 'button',
  title,
  children,
  onClick,
  isDisabled,
  'aria-busy': ariaBusy,
}: TButtonProps) => {
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={ariaBusy}
      data-testid={dataTestId}
      className={buttonVariants({ variant, size, class: className })}
    >
      {children}
    </button>
  );
};

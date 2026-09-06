import { SIZE } from '@blog/config';
import { Spinner } from '@platform/components/shared/spinner';
import type { AriaAttributes, MouseEventHandler, ReactNode } from 'react';

import { buttonVariants, type TButtonVariants } from './button-variants';

export type TButtonProps = {
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
  type?: 'button' | 'submit' | 'reset';
  isDisabled?: boolean;
  /** Shows a spinner ahead of the label, sets `aria-busy`, and disables the button for the duration. */
  isPending?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
  className?: string;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  /** Appends a decorative arrow, hidden from the accessible name. */
  hasArrow?: boolean;
};

export const Button = ({
  variant,
  size,
  type = 'button',
  isDisabled,
  isPending = false,
  onClick,
  children,
  className,
  'aria-describedby': ariaDescribedBy,
  hasArrow,
}: TButtonProps) => {
  return (
    <button
      type={type}
      disabled={isDisabled || isPending}
      aria-busy={isPending}
      onClick={onClick}
      className={buttonVariants({ variant, size, class: className })}
      aria-describedby={ariaDescribedBy}
    >
      {isPending && (
        <span aria-hidden="true">
          <Spinner label="" size={SIZE.SM} />
        </span>
      )}
      {children}
      {hasArrow && <span aria-hidden="true"> →</span>}
    </button>
  );
};

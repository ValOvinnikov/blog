import type { MouseEventHandler, ReactNode } from 'react';

import { buttonVariants, type TButtonVariants } from './button-variants';

export type TButtonProps = {
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
  type?: 'button' | 'submit' | 'reset';
  isDisabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
  className?: string;
};

export const Button = ({
  variant,
  size,
  type = 'button',
  isDisabled,
  onClick,
  children,
  className,
}: TButtonProps) => {
  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={buttonVariants({ variant, size, class: className })}
    >
      {children}
    </button>
  );
};

import type { IWithDataTestId } from '@blog/config';
import { type ButtonHTMLAttributes } from 'react';

import { buttonVariants, type TButtonVariants } from './button-variants';

export type TButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  TButtonVariants &
  IWithDataTestId;

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

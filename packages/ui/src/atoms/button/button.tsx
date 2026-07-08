import type { IWithDataTestId } from '@blog/config';
import { type ButtonHTMLAttributes } from 'react';
import { type VariantProps } from 'tailwind-variants';

import { buttonVariants } from './button-variants';

export type TButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> &
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

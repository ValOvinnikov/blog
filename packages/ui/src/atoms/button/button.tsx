import { type ButtonHTMLAttributes } from 'react';
import { type VariantProps } from 'tailwind-variants';

import { buttonVariants } from './button-variants';

export type TButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = ({ className, variant, size, ...rest }: TButtonProps) => {
  return (
    <button
      {...rest}
      type="button"
      className={buttonVariants({ variant, size, class: className })}
    />
  );
};

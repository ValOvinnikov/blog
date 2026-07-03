import { cva, type VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes } from 'react';

import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-bg hover:opacity-90',
        secondary:
          'border border-border bg-bg text-fg hover:bg-fg hover:text-bg',
        ghost: 'text-fg hover:bg-border',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export type TButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

/**
 * Primary UI action component.
 *
 * Supports three variants (`primary`, `secondary`, `ghost`) and three sizes
 * (`sm`, `md`, `lg`). Forwards all native `<button>` attributes and merges
 * the optional `className` prop on top of variant classes.
 */
export function Button({ className, variant, size, ...rest }: TButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...rest}
    />
  );
}

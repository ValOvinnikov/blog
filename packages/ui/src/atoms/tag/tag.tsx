import { type HTMLAttributes } from 'react';
import { type VariantProps } from 'tailwind-variants';

import { tagVariants } from './tag-variants';

export type TTagProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof tagVariants>;

export function Tag({ className, variant, size, ...rest }: TTagProps) {
  return (
    <span
      className={tagVariants({ variant, size, class: className })}
      {...rest}
    />
  );
}

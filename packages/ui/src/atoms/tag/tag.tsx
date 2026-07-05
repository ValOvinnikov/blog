import { type HTMLAttributes } from 'react';
import { type VariantProps } from 'tailwind-variants';

import { tagVariants } from './tag-variants';

export type TTagProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof tagVariants>;

export const Tag = ({ className, variant, ...rest }: TTagProps) => {
  return (
    <span className={tagVariants({ variant, class: className })} {...rest} />
  );
};

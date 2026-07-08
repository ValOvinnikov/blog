import { type HTMLAttributes } from 'react';
import { type VariantProps } from 'tailwind-variants';

import { textVariants } from './text-variants';

export type TTextProps = HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants>;

export const Text = ({ variant, className, ...rest }: TTextProps) => (
  <p className={textVariants({ variant, class: className })} {...rest} />
);

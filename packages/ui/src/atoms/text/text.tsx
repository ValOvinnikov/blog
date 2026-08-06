import { type HTMLAttributes } from 'react';

import { textVariants, type TTextVariants } from './text-variants';

export type TTextProps = HTMLAttributes<HTMLParagraphElement> & TTextVariants;

export const Text = ({ variant, className, ...rest }: TTextProps) => (
  <p className={textVariants({ variant, class: className })} {...rest} />
);

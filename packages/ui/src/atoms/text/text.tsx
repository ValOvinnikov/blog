import { type HTMLAttributes } from 'react';

import { textVariants, type TTextVariants } from './text-variants';

export type TTextProps = HTMLAttributes<HTMLParagraphElement> & TTextVariants;

/**
 * Text — the body-copy paragraph primitive: applies a `variant` from the type
 * scale to a `<p>`. Use for prose and captions; headings belong to `Heading`.
 */
export const Text = ({ variant, className, ...rest }: TTextProps) => (
  <p className={textVariants({ variant, class: className })} {...rest} />
);

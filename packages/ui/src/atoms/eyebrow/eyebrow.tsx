import { type HTMLAttributes } from 'react';

import { eyebrowVariants } from './eyebrow-variants';

export type TEyebrowProps = HTMLAttributes<HTMLParagraphElement>;

/**
 * Eyebrow atom — small uppercase label displayed above a heading to provide
 * contextual category or section context.
 */
export const Eyebrow = ({ className, children, ...rest }: TEyebrowProps) => {
  return (
    <p className={eyebrowVariants({ class: className })} {...rest}>
      {children}
    </p>
  );
};

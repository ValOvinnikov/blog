import type { ElementType, ReactNode } from 'react';

import { textVariants, type TTextVariants } from './text-variants';

export type TTextProps = {
  variant?: TTextVariants['variant'];
  /** Which element to render. Defaults to `p`; use `span` for inline text. */
  as?: 'p' | 'span';
  children: ReactNode;
  className?: string;
};

export const Text = ({
  variant,
  as = 'p',
  children,
  className,
}: TTextProps) => {
  const Component: ElementType = as;

  return (
    <Component className={textVariants({ variant, class: className })}>
      {children}
    </Component>
  );
};

import type { ElementType, ReactNode } from 'react';

import { textVariants, type TTextVariants } from './text-variants';

export type TTextProps = {
  variant?: TTextVariants['variant'];
  /** Which element to render. Defaults to `p`; use `span` for inline text. */
  as?: 'p' | 'span';
  children: ReactNode;
  className?: string;
  /** Lets another control's `aria-describedby` point at this text. */
  id?: string;
};

export const Text = ({
  variant,
  as = 'p',
  children,
  className,
  id,
}: TTextProps) => {
  const Component: ElementType = as;

  return (
    <Component id={id} className={textVariants({ variant, class: className })}>
      {children}
    </Component>
  );
};

import type { ElementType, ReactNode } from 'react';

import { textVariants, type TTextVariants } from './text-variants';

export type TTextProps = {
  variant?: TTextVariants['variant'];
  as?: 'p' | 'span';
  children: ReactNode;
  className?: string;
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

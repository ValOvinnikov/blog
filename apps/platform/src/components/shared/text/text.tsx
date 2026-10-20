import type { IWithClassName } from '@blog/config/types';
import type { ElementType, ReactNode, Ref } from 'react';

import { textVariants, type TTextVariants } from './text-variants';

export type TTextProps = IWithClassName & {
  variant?: TTextVariants['variant'];
  as?: 'p' | 'span';
  children: ReactNode;
  id?: string;
  ref?: Ref<HTMLParagraphElement & HTMLSpanElement>;
};

export const Text = ({
  variant,
  as = 'p',
  children,
  className,
  id,
  ref,
}: TTextProps) => {
  const Component: ElementType = as;

  return (
    <Component
      ref={ref}
      id={id}
      className={textVariants({ variant, class: className })}
    >
      {children}
    </Component>
  );
};

import type { HTMLAttributes } from 'react';

import { containerVariants } from './container-variants';

export interface IContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'main' | 'section' | 'header' | 'footer';
}

export function Container({
  as: Component = 'div',
  className,
  ...rest
}: IContainerProps) {
  return (
    <Component className={containerVariants({ class: className })} {...rest} />
  );
}

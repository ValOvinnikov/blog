import type { HTMLAttributes } from 'react';

export interface IContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'main' | 'section' | 'header' | 'footer';
}

export function Container({
  as: Component = 'div',
  className,
  ...rest
}: IContainerProps) {
  return (
    <Component
      className={`mx-auto w-full max-w-content px-gutter${className ? ` ${className}` : ''}`}
      {...rest}
    />
  );
}

import type { ComponentPropsWithoutRef, ElementType } from 'react';

import { containerVariants } from './container-variants';

type TContainerOwnProps = {
  className?: string;
};

export type TContainerProps<C extends ElementType = 'div'> =
  TContainerOwnProps & {
    as?: C;
  } & Omit<ComponentPropsWithoutRef<C>, keyof TContainerOwnProps | 'as'>;

export const Container = <C extends ElementType = 'div'>({
  as,
  className,
  ...rest
}: TContainerProps<C>) => {
  const Component = (as ?? 'div') as ElementType;

  return (
    <Component className={containerVariants({ class: className })} {...rest} />
  );
};

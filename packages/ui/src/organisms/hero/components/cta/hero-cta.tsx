import type { TPolymorphicProps } from '@blog/config/react';
import type { ElementType, ReactNode } from 'react';

import { buttonVariants } from '../../../../atoms/button/button-variants';
import { heroCtaVariants } from './hero-cta-variants';

type THeroCtaOwnProps = {
  className?: string;
  children?: ReactNode;
};

export const HeroCta = <C extends ElementType = 'a'>({
  as,
  className,
  children,
  ...rest
}: TPolymorphicProps<C, THeroCtaOwnProps>) => {
  const Component = (as ?? 'a') as ElementType;
  return (
    <Component
      className={buttonVariants({
        class: heroCtaVariants({ class: className }),
      })}
      {...rest}
    >
      {children}
    </Component>
  );
};

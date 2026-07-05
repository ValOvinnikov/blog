import type { ComponentPropsWithoutRef } from 'react';

import { heroCtaVariants } from './hero-cta-variants';

export const HeroCta = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => (
  <div className={heroCtaVariants({ class: className })} {...rest} />
);

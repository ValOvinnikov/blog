import type { ComponentPropsWithoutRef } from 'react';

import { heroMediaVariants } from './hero-media-variants';

export const HeroMedia = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => (
  <div className={heroMediaVariants({ class: className })} {...rest} />
);

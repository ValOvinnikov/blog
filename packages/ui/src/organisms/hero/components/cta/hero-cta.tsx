import type { ComponentPropsWithoutRef } from 'react';

import { heroCtaVariants } from './hero-cta-variants';

/**
 * HeroCta — the call-to-action slot of a `Hero`; a styled `<div>` for the hero's
 * buttons or links.
 */
export const HeroCta = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => (
  <div className={heroCtaVariants({ class: className })} {...rest} />
);

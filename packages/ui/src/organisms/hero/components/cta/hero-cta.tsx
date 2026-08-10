import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { heroCtaVariants } from './hero-cta-variants';

interface IHeroCtaProps
  extends ComponentPropsWithoutRef<'div'>, IWithDataTestId {}

/**
 * HeroCta — the call-to-action slot of a `Hero`; a styled `<div>` for the hero's
 * buttons or links.
 */
export const HeroCta = ({ className, dataTestId, ...rest }: IHeroCtaProps) => (
  <div
    className={heroCtaVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);

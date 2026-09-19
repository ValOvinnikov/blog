import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { heroCtaVariants } from './hero-cta-variants';

export type THeroCtaProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** The call-to-action slot of a `Hero`; a styled `<div>` for the hero's buttons or links. */
export const HeroCta = ({ className, dataTestId, children }: THeroCtaProps) => (
  <div
    className={heroCtaVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);

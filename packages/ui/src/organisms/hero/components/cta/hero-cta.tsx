import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { heroCtaVariants, type THeroCtaVariants } from './hero-cta-variants';

export type THeroCtaProps = IWithClassName &
  IWithDataTestId & {
    contentAlignment?: THeroCtaVariants['contentAlignment'];
    children?: ReactNode;
  };

/** The call-to-action slot of a `Hero`; a styled `<div>` for the hero's buttons or links. */
export const HeroCta = ({
  contentAlignment,
  className,
  dataTestId,
  children,
}: THeroCtaProps) => (
  <div
    className={heroCtaVariants({ contentAlignment, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);

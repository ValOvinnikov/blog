import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { heroBodyVariants, type THeroBodyVariants } from './hero-body-variants';

export type THeroBodyProps = IWithClassName &
  IWithDataTestId & {
    contentAlignment?: THeroBodyVariants['contentAlignment'];
    children?: ReactNode;
  };

/** The rich body-copy slot of a `Hero`, rendered after the excerpt and before `Hero.Cta`. */
export const HeroBody = ({
  contentAlignment,
  className,
  dataTestId,
  children,
}: THeroBodyProps) => (
  <div
    className={heroBodyVariants({ contentAlignment, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);

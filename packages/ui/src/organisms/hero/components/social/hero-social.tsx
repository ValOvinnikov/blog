import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  heroSocialVariants,
  type THeroSocialVariants,
} from './hero-social-variants';

export type THeroSocialProps = IWithClassName &
  IWithDataTestId & {
    contentAlignment?: THeroSocialVariants['contentAlignment'];
    children?: ReactNode;
  };

/**
 * HeroSocial — the trailing slot of a `Hero`, rendered after `Hero.Cta`; a
 * styled `<div>` for the caller's own social links, typically a labelled list.
 */
export const HeroSocial = ({
  contentAlignment,
  className,
  dataTestId,
  children,
}: THeroSocialProps) => (
  <div
    className={heroSocialVariants({ contentAlignment, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);

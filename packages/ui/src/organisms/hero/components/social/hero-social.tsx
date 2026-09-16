import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  heroSocialVariants,
  type THeroSocialVariants,
} from './hero-social-variants';

export type THeroSocialProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel: string;
    contentAlignment?: THeroSocialVariants['contentAlignment'];
    children?: ReactNode;
  };

/**
 * HeroSocial — the social-links slot of a `Hero`, rendered after `Hero.Cta`; a
 * labelled list the caller fills with its own link items.
 */
export const HeroSocial = ({
  ariaLabel,
  contentAlignment,
  className,
  dataTestId,
  children,
}: THeroSocialProps) => (
  <ul
    aria-label={ariaLabel}
    className={heroSocialVariants({ contentAlignment, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </ul>
);

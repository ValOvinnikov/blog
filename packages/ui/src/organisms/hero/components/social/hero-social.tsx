import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  heroSocialVariants,
  type THeroSocialVariants,
} from './hero-social-variants';

export type THeroSocialProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel: string;
    /** Set by `Hero` — mirrors the resolved `contentAlignment` so the list's flex justification matches the copy column. */
    alignment?: THeroSocialVariants['alignment'];
    children?: ReactNode;
  };

/**
 * HeroSocial — the social-links slot of a `Hero`, rendered after `Hero.Cta`; a
 * labelled list the caller fills with its own link items.
 */
export const HeroSocial = ({
  ariaLabel,
  alignment,
  className,
  dataTestId,
  children,
}: THeroSocialProps) => (
  <ul
    aria-label={ariaLabel}
    className={heroSocialVariants({ alignment, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </ul>
);

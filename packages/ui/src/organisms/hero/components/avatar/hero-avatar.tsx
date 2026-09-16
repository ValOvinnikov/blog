import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  heroAvatarVariants,
  type THeroAvatarVariants,
} from './hero-avatar-variants';

export type THeroAvatarProps = IWithClassName &
  IWithDataTestId & {
    /** Set by `Hero` — mirrors the resolved `contentAlignment` so the frame sits under the copy the same way the heading and CTA do. */
    alignment?: THeroAvatarVariants['alignment'];
    children?: ReactNode;
  };

/**
 * HeroAvatar — the portrait slot of a `Hero`, rendered before the eyebrow; a
 * round frame for a person's photo on the profile hero.
 */
export const HeroAvatar = ({
  alignment,
  className,
  dataTestId,
  children,
}: THeroAvatarProps) => (
  <div
    className={heroAvatarVariants({ alignment, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);

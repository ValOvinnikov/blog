import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  heroAvatarVariants,
  type THeroAvatarVariants,
} from './hero-avatar-variants';

export type THeroAvatarProps = IWithClassName &
  IWithDataTestId & {
    contentAlignment?: THeroAvatarVariants['contentAlignment'];
    children?: ReactNode;
  };

/**
 * HeroAvatar — the portrait slot of a `Hero`, rendered before the eyebrow; a
 * round frame for a person's photo on the profile hero.
 */
export const HeroAvatar = ({
  contentAlignment,
  className,
  dataTestId,
  children,
}: THeroAvatarProps) => (
  <div
    className={heroAvatarVariants({ contentAlignment, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);

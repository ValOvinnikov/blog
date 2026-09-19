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

/** The portrait slot of a `Hero`, rendered before the eyebrow; a styled `<div>` for the caller's own `Avatar` or image. */
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

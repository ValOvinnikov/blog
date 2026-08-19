import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { postCardMediaVariants } from './post-card-media-variants';

export type TPostCardMediaProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * PostCardMedia — the media region at the top of a `PostCard`; a styled `<div>`
 * wrapper you fill with an image or `MediaFrame`.
 */
export const PostCardMedia = ({
  className,
  dataTestId,
  children,
}: TPostCardMediaProps) => (
  <div
    className={postCardMediaVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);

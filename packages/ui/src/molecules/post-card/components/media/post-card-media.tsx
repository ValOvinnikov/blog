import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  postCardMediaVariants,
  type TPostCardMediaVariants,
} from './post-card-media-variants';

export type TPostCardMediaProps = IWithClassName &
  IWithDataTestId & {
    /** Set by `PostCard` on lead cards — swaps the default 16:9 frame for a taller 4:3 one. */
    isLead?: TPostCardMediaVariants['isLead'];
    children?: ReactNode;
  };

/**
 * PostCardMedia — the media region at the top of a `PostCard`; a styled `<div>`
 * wrapper you fill with an image or `MediaFrame`.
 */
export const PostCardMedia = ({
  isLead,
  className,
  dataTestId,
  children,
}: TPostCardMediaProps) => (
  <div
    className={postCardMediaVariants({ isLead, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </div>
);

import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { postCardTitleVariants } from './post-card-title-variants';

export type TPostCardTitleProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * PostCardTitle — the post heading inside a `PostCard`, rendered as a styled `<h3>`.
 */
export const PostCardTitle = ({
  className,
  dataTestId,
  children,
}: TPostCardTitleProps) => (
  <h3
    className={postCardTitleVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </h3>
);

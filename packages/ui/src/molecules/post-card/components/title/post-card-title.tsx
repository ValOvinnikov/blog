import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { postCardTitleVariants } from './post-card-title-variants';

interface IPostCardTitleProps
  extends ComponentPropsWithoutRef<'h3'>, IWithDataTestId {}

/**
 * PostCardTitle — the post heading inside a `PostCard`, rendered as a styled `<h3>`.
 */
export const PostCardTitle = ({
  className,
  dataTestId,
  ...rest
}: IPostCardTitleProps) => (
  <h3
    className={postCardTitleVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);

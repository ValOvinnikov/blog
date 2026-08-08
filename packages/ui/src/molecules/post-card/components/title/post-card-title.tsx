import type { ComponentPropsWithoutRef } from 'react';

import { postCardTitleVariants } from './post-card-title-variants';

/**
 * PostCardTitle — the post heading inside a `PostCard`, rendered as a styled `<h3>`.
 */
export const PostCardTitle = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'h3'>) => (
  <h3 className={postCardTitleVariants({ class: className })} {...rest} />
);

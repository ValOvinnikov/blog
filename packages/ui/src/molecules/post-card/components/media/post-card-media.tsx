import type { ComponentPropsWithoutRef } from 'react';

import { postCardMediaVariants } from './post-card-media-variants';

/**
 * PostCardMedia — the media region at the top of a `PostCard`; a styled `<div>`
 * wrapper you fill with an image or `MediaFrame`.
 */
export const PostCardMedia = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => (
  <div className={postCardMediaVariants({ class: className })} {...rest} />
);

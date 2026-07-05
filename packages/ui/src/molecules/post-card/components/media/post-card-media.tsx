import type { ComponentPropsWithoutRef } from 'react';

import { postCardMediaVariants } from './post-card-media-variants';

export const PostCardMedia = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => (
  <div className={postCardMediaVariants({ class: className })} {...rest} />
);

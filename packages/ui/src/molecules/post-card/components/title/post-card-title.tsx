import type { ComponentPropsWithoutRef } from 'react';

import { postCardTitleVariants } from './post-card-title-variants';

export const PostCardTitle = ({
  className,
  ...rest
}: ComponentPropsWithoutRef<'h3'>) => (
  <h3 className={postCardTitleVariants({ class: className })} {...rest} />
);

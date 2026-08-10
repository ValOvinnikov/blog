import type { IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { postCardMediaVariants } from './post-card-media-variants';

interface IPostCardMediaProps
  extends ComponentPropsWithoutRef<'div'>, IWithDataTestId {}

/**
 * PostCardMedia — the media region at the top of a `PostCard`; a styled `<div>`
 * wrapper you fill with an image or `MediaFrame`.
 */
export const PostCardMedia = ({
  className,
  dataTestId,
  ...rest
}: IPostCardMediaProps) => (
  <div
    className={postCardMediaVariants({ class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);

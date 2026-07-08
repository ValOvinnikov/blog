import { Size } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import type { ComponentPropsWithoutRef } from 'react';

import { postCardFooterVariants } from './post-card-footer-variants';

export interface IPostCardFooterProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> {
  authorName?: string;
  authorAvatarSrc?: string;
  publishedAt?: string;
  formattedDate?: string;
}

export const PostCardFooter = ({
  authorName,
  authorAvatarSrc,
  publishedAt,
  formattedDate,
  className,
  ...rest
}: IPostCardFooterProps) => (
  <div className={postCardFooterVariants({ class: className })} {...rest}>
    {authorName && (
      <Avatar
        name={authorName}
        alt={authorName}
        src={authorAvatarSrc}
        size={Size.SM}
      />
    )}
    {authorName && <span>{authorName}</span>}
    {publishedAt && formattedDate && (
      <time dateTime={publishedAt}>{formattedDate}</time>
    )}
  </div>
);

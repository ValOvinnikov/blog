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
  /** Post category, rendered lowercased with a trailing decorative arrow. */
  category?: string;
}

const s = postCardFooterVariants();

/**
 * PostCardFooter — the byline row at the bottom of a `PostCard`: optional author
 * avatar and name, published date, and a category tag.
 */
export const PostCardFooter = ({
  authorName,
  authorAvatarSrc,
  publishedAt,
  formattedDate,
  category,
  className,
  ...rest
}: IPostCardFooterProps) => (
  <div className={s.root({ class: className })} {...rest}>
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
    {category && (
      <span className={s.category()}>
        {category.toLowerCase()} <span aria-hidden="true">→</span>
      </span>
    )}
  </div>
);

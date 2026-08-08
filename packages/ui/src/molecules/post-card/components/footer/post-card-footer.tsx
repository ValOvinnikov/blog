import { Size } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { postCardFooterVariants } from './post-card-footer-variants';

export interface IPostCardFooterProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> {
  authorName?: string;
  authorAvatarSrc?: string;
  publishedAt?: string;
  formattedDate?: string;
  /** Post category, rendered lowercased alongside `leadingIcon`/`trailingIcon`. */
  category?: string;
  /** Icon rendered before the category text, e.g. `<Icon name={ICONS.X} />`. */
  leadingIcon?: ReactNode;
  /** Icon rendered after the category text, e.g. `<Icon name={ICONS.ARROW} />`. */
  trailingIcon?: ReactNode;
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
  leadingIcon,
  trailingIcon,
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
        {leadingIcon} {category.toLowerCase()} {trailingIcon}
      </span>
    )}
  </div>
);

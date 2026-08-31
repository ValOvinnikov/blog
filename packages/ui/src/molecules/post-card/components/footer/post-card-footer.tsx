import { SIZE, type IWithClassName, type IWithDataTestId } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import type { ReactNode } from 'react';

import { postCardFooterVariants } from './post-card-footer-variants';

export type TPostCardFooterProps = IWithClassName &
  IWithDataTestId & {
    authorName?: string;
    authorAvatarSrc?: string;
    publishedAt?: string;
    formattedDate?: string;
    /** Post topic, rendered lowercased alongside `leadingIcon`/`trailingIcon`. */
    topic?: string;
    /** Icon rendered before the topic text, e.g. `<Icon name={ICONS.X} />`. */
    leadingIcon?: ReactNode;
    /** Icon rendered after the topic text, e.g. `<Icon name={ICONS.ARROW} />`. */
    trailingIcon?: ReactNode;
  };

const s = postCardFooterVariants();

/**
 * PostCardFooter — the byline row at the bottom of a `PostCard`: optional author
 * avatar and name, published date, and a topic tag.
 */
export const PostCardFooter = ({
  authorName,
  authorAvatarSrc,
  publishedAt,
  formattedDate,
  topic,
  leadingIcon,
  trailingIcon,
  className,
  dataTestId,
}: TPostCardFooterProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    {authorName && (
      <Avatar
        name={authorName}
        alt={authorName}
        src={authorAvatarSrc}
        size={SIZE.SM}
      />
    )}
    {authorName && <span>{authorName}</span>}
    {publishedAt && formattedDate && (
      <time dateTime={publishedAt}>{formattedDate}</time>
    )}
    {topic && (
      <span className={s.topic()}>
        {leadingIcon} {topic.toLowerCase()} {trailingIcon}
      </span>
    )}
  </div>
);

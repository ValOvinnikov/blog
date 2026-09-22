import { SIZE, type IWithClassName, type IWithDataTestId } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import type { ReactNode } from 'react';

import { mediaCardFooterVariants } from './media-card-footer-variants';

export type TMediaCardFooterProps = IWithClassName &
  IWithDataTestId & {
    authorName?: string;
    authorAvatarSrc?: string;
    publishedAt?: string;
    formattedDate?: string;
    topic?: string;
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
  };

const s = mediaCardFooterVariants();

/** The byline row at the bottom of a `MediaCard`. */
export const MediaCardFooter = ({
  authorName,
  authorAvatarSrc,
  publishedAt,
  formattedDate,
  topic,
  leadingIcon,
  trailingIcon,
  className,
  dataTestId,
}: TMediaCardFooterProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    {authorName && (
      <Avatar name={authorName} alt="" src={authorAvatarSrc} size={SIZE.SM} />
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

import { type IWithDataTestId, Size } from '@blog/config';
import type { HTMLAttributes } from 'react';

import { Avatar } from '../../atoms/avatar';
import { Heading } from '../../atoms/heading';
import { Tag } from '../../atoms/tag';
import { postCardVariants } from './post-card-variants';

export interface IPostCardProps
  extends HTMLAttributes<HTMLDivElement>, IWithDataTestId {
  title: string;
  excerpt?: string;
  href: string;
  publishedAt?: string;
  tags?: string[];
  coverImage?: { src: string; alt: string };
  authorName?: string;
  authorAvatarSrc?: string;
}

export function PostCard({
  title,
  excerpt,
  href,
  publishedAt,
  tags,
  coverImage,
  authorName,
  authorAvatarSrc,
  className,
  dataTestId,
  ...rest
}: IPostCardProps) {
  const {
    root,
    image,
    content,
    title: titleSlot,
    excerpt: excerptSlot,
    meta,
    tags: tagsSlot,
  } = postCardVariants();

  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined;

  return (
    <div
      className={root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {coverImage && (
        <img src={coverImage.src} alt={coverImage.alt} className={image()} />
      )}

      <div className={content()}>
        <a
          href={href}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          <Heading level={2} size={Size.SM} className={titleSlot()}>
            {title}
          </Heading>
        </a>

        {tags && tags.length > 0 && (
          <div className={tagsSlot()}>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}

        {excerpt && <p className={excerptSlot()}>{excerpt}</p>}

        {(publishedAt || authorName) && (
          <div className={meta()}>
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
        )}
      </div>
    </div>
  );
}

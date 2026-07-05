import { type IWithDataTestId, Size } from '@blog/config';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { Fragment } from 'react';

import { Avatar } from '../../atoms/avatar';
import { Tag } from '../../atoms/tag';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '../../lib/compound';
import { PostCardMedia } from './components/media/post-card-media';
import { PostCardTitle } from './components/title/post-card-title';
import { postCardVariants } from './post-card-variants';

const s = postCardVariants();

const PostCardParts = {
  Media: PostCardMedia,
  Title: PostCardTitle,
} satisfies Record<string, ElementType>;

export interface IPostCardProps
  extends
    Omit<ComponentPropsWithoutRef<'article'>, 'children'>,
    IWithDataTestId {
  excerpt?: string;
  tags?: string[];
  publishedAt?: string;
  authorName?: string;
  authorAvatarSrc?: string;
  children?: TCompoundChildren<typeof PostCardParts>;
}

const PostCardRoot = ({
  excerpt,
  tags,
  publishedAt,
  authorName,
  authorAvatarSrc,
  children,
  className,
  dataTestId,
  ...rest
}: IPostCardProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, PostCardParts);
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : undefined;

  return (
    <article
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {slots.Media}
      <div className={s.content()}>
        {slots.Title}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
        {tags && tags.length > 0 && (
          <div className={s.tags()}>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
        {excerpt && <p className={s.excerpt()}>{excerpt}</p>}
        {(publishedAt || authorName) && (
          <div className={s.meta()}>
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
    </article>
  );
};

export const PostCard: TCompoundComponent<
  typeof PostCardRoot,
  typeof PostCardParts
> = Object.assign(PostCardRoot, PostCardParts);

import { type IWithDataTestId } from '@blog/config';
import { Tag } from '@blog/ui/atoms/tag';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/compound';
import { CardMeta } from '@blog/ui/molecules/card-meta';
import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { Fragment } from 'react';

import { PostCardFooter } from './components/footer/post-card-footer';
import { PostCardMedia } from './components/media/post-card-media';
import { PostCardTitle } from './components/title/post-card-title';
import { postCardVariants } from './post-card-variants';

const s = postCardVariants();

const PostCardParts = {
  Media: PostCardMedia,
  Meta: CardMeta,
  Title: PostCardTitle,
  Footer: PostCardFooter,
} satisfies Record<string, ElementType>;

export interface IPostCardProps
  extends
    Omit<ComponentPropsWithoutRef<'article'>, 'children'>,
    IWithDataTestId {
  excerpt?: string;
  tags?: string[];
  children?: TCompoundChildren<typeof PostCardParts>;
}

const PostCardRoot = ({
  excerpt,
  tags,
  children,
  className,
  dataTestId,
  ...rest
}: IPostCardProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, PostCardParts);

  return (
    <article
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {slots.Media}
      <div className={s.content()}>
        {slots.Meta}
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
        {slots.Footer}
      </div>
    </article>
  );
};

export const PostCard: TCompoundComponent<
  typeof PostCardRoot,
  typeof PostCardParts
> = Object.assign(PostCardRoot, PostCardParts);

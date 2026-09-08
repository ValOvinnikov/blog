import { type IWithClassName, type IWithDataTestId } from '@blog/config';
import { Tag } from '@blog/ui/atoms/tag';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { CardMeta } from '@blog/ui/molecules/card-meta';
import {
  cloneElement,
  Fragment,
  type ElementType,
  type ReactElement,
} from 'react';

import { PostCardFooter } from './components/footer/post-card-footer';
import {
  PostCardMedia,
  type TPostCardMediaProps,
} from './components/media/post-card-media';
import {
  PostCardTitle,
  type TPostCardTitleProps,
} from './components/title/post-card-title';
import { postCardVariants, type TPostCardVariants } from './post-card-variants';

const PostCardParts = {
  Media: PostCardMedia,
  Meta: CardMeta,
  Title: PostCardTitle,
  Footer: PostCardFooter,
} satisfies Record<string, ElementType>;

export type TPostCardProps = IWithClassName &
  IWithDataTestId & {
    excerpt?: string;
    tags?: string[];
    /**
     * From `md`, lays the media and copy side by side (media first) in an
     * equal 1:1 split; below `md` the layout is unchanged (media stacked
     * above copy). Has no effect without a `PostCard.Media` slot — the copy
     * stays full-width.
     */
    isSplit?: TPostCardVariants['isSplit'];
    /**
     * Renders the title at display size, clamps the excerpt to three lines
     * instead of two, and gives the media a taller frame — for a single
     * editor-pinned spotlight card.
     */
    isLead?: TPostCardVariants['isLead'];
    children?: TCompoundChildren<typeof PostCardParts>;
  };

/**
 * PostCard — the article summary card used in listings; composes
 * `PostCard.Media`, `PostCard.Meta`, `PostCard.Title`, and `PostCard.Footer`
 * slots around an optional `excerpt` and `tags` row, rendered as an `<article>`.
 */
const PostCardRoot = ({
  excerpt,
  tags,
  isSplit,
  isLead,
  children,
  className,
  dataTestId,
}: TPostCardProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, PostCardParts);
  const hasMedia = Boolean(slots.Media);
  const isSplitLayout = Boolean(isSplit) && hasMedia;
  const s = postCardVariants({ isSplit: isSplitLayout, isLead });

  const media =
    isLead && slots.Media
      ? cloneElement(slots.Media as ReactElement<TPostCardMediaProps>, {
          isLead: true,
        })
      : slots.Media;

  return (
    <article className={s.root({ class: className })} data-testid={dataTestId}>
      {isSplitLayout ? <div className={s.media()}>{media}</div> : media}
      <div className={s.content()} data-testid="post-card-content">
        {slots.Meta}
        {isLead && slots.Title
          ? cloneElement(slots.Title as ReactElement<TPostCardTitleProps>, {
              isLead: true,
            })
          : slots.Title}
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

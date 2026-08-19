import {
  ICONS,
  Size,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/atoms/icon';
import { PostCard } from '@blog/ui/molecules/post-card';
import type { ElementType } from 'react';

import {
  postsSectionVariants,
  type TPostsSectionVariants,
} from './posts-section-variants';

export interface IPostCardCategoryData {
  title: string;
}

export interface IPostCardData {
  id: string;
  href: string;
  title: string;
  excerpt?: string;
  publishedAt: string;
  formattedDate: string;
  readingTime?: string;
  category: IPostCardCategoryData;
}

export type TPostsSectionProps = IWithClassName &
  IWithDataTestId & {
    posts: IPostCardData[];
    title: string;
    titleId: string;
    /** Component each card's title link renders as — defaults to a plain `<a>`. Pass the app router's Link to get client-side navigation. */
    linkAs?: TAnchorElementType;
    /** Optional supporting copy rendered under the heading. */
    supportingText?: string;
    /** Horizontal alignment of the heading and supporting text. Defaults to left. */
    align?: TPostsSectionVariants['align'];
    /** Message rendered under the heading when `posts` is empty. Omit to keep the section rendering nothing (existing behavior). */
    emptyMessage?: string;
    /**
     * Render as a distinct section separated from the content above it by a
     * top rule, with the heading and grid constrained to the shared content
     * column. Omit (or pass `false`) for the existing inline behavior, sized
     * by the parent. Heading markup/`aria` wiring is unchanged either way.
     */
    tinted?: TPostsSectionVariants['tinted'];
    /**
     * Drops this component's own top margin. Set when a parent (e.g. `Section`)
     * already owns the vertical spacing around it, so the two don't stack.
     */
    wrapped?: TPostsSectionVariants['wrapped'];
  };

/**
 * PostsSection — labeled section rendering a set of posts in a responsive
 * grid, generic enough to reuse for other post listings (e.g. related posts,
 * category pages).
 */
export const PostsSection = ({
  posts,
  title,
  titleId,
  className,
  dataTestId,
  linkAs,
  supportingText,
  align,
  emptyMessage,
  tinted,
  wrapped,
}: TPostsSectionProps) => {
  const isEmpty = posts.length === 0;
  if (isEmpty && !emptyMessage) return null;
  const Component = (linkAs ?? 'a') as ElementType;
  const s = postsSectionVariants({ tinted, wrapped, align });

  const content = (
    <>
      <h2 id={titleId} className={s.label()}>
        {title}
      </h2>
      {supportingText && <p className={s.supportingText()}>{supportingText}</p>}
      {isEmpty ? (
        <p className={s.emptyMessage()}>{emptyMessage}</p>
      ) : (
        <div className={s.grid()}>
          {posts.map((post) => (
            <PostCard key={post.id} excerpt={post.excerpt}>
              <PostCard.Meta
                dateValue={post.publishedAt}
                dateLabel={post.formattedDate}
                readingTime={post.readingTime}
              />
              <PostCard.Title>
                <Component href={post.href} className={s.titleLink()}>
                  {post.title}
                </Component>
              </PostCard.Title>
              <PostCard.Footer
                category={post.category.title}
                trailingIcon={
                  <Icon
                    name={ICONS.ARROW}
                    size={Size.SM}
                    dataTestId="post-card-footer-arrow"
                  />
                }
              />
            </PostCard>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      {tinted ? (
        <div className={s.inner()}>
          <div className={s.contentGroup()}>{content}</div>
        </div>
      ) : (
        content
      )}
    </div>
  );
};

import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { PostCard } from '@blog/ui/molecules/post-card';
import type { ElementType } from 'react';

import { postsSectionVariants } from './posts-section-variants';

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

export interface IPostsSectionProps extends IWithDataTestId {
  posts: IPostCardData[];
  title: string;
  titleId: string;
  className?: string;
  /** Component each card's title link renders as — defaults to a plain `<a>`. Pass the app router's Link to get client-side navigation. */
  linkAs?: TAnchorElementType;
  /** Message rendered under the heading when `posts` is empty. Omit to keep the section rendering nothing (existing behavior). */
  emptyMessage?: string;
}

const s = postsSectionVariants();

/**
 * PostsSection — labeled section rendering a set of posts in a responsive
 * grid. Replaces the ad-hoc `ContentSection` + `PostGrid` composition on the
 * home page with a single organism; generic enough to reuse for other post
 * listings (e.g. related posts, category pages).
 */
export const PostsSection = ({
  posts,
  title,
  titleId,
  className,
  dataTestId,
  linkAs,
  emptyMessage,
}: IPostsSectionProps) => {
  const isEmpty = posts.length === 0;
  if (isEmpty && !emptyMessage) return null;
  const Component = (linkAs ?? 'a') as ElementType;

  return (
    <section
      aria-labelledby={titleId}
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      <h2 id={titleId} className={s.label()}>
        {title}
      </h2>
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
                category={post.category.title}
              />
              <PostCard.Title>
                <Component href={post.href} className={s.titleLink()}>
                  {post.title}
                </Component>
              </PostCard.Title>
            </PostCard>
          ))}
        </div>
      )}
    </section>
  );
};

import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { resolveComponent } from '@blog/ui/lib/react';

import { taxonomyCardPostsVariants } from './taxonomy-card-posts-variants';

export type TTaxonomyCardPost = {
  id: string;
  title: string;
  href: string;
};

export type TTaxonomyCardPostsProps = IWithClassName &
  IWithDataTestId & {
    posts: TTaxonomyCardPost[];
    ariaLabel: string;
    /** Resolved and passed down by `TaxonomyCard` from its own `linkAs`. */
    linkAs?: TAnchorElementType;
  };

const s = taxonomyCardPostsVariants();

/**
 * TaxonomyCard.Posts — the taxonomy's latest posts, listed between the
 * card's description and its post count.
 */
export const TaxonomyCardPosts = ({
  posts,
  ariaLabel,
  linkAs,
  className,
  dataTestId,
}: TTaxonomyCardPostsProps) => {
  if (posts.length === 0) return null;

  const LinkComponent = resolveComponent(linkAs, 'a');

  return (
    <ul
      aria-label={ariaLabel}
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      {posts.map((post) => (
        <li key={post.id}>
          <LinkComponent href={post.href} className={s.link()}>
            {post.title}
          </LinkComponent>
        </li>
      ))}
    </ul>
  );
};

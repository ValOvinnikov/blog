import {
  A_AS_CONST,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';

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
    label?: string;
    linkAs?: TAnchorElementType;
  };

const s = taxonomyCardPostsVariants();

/** The topic or tag's latest posts, set apart from the card's description as their own list. */
export const TaxonomyCardPosts = ({
  posts,
  ariaLabel,
  label,
  linkAs,
  className,
  dataTestId,
}: TTaxonomyCardPostsProps) => {
  if (posts.length === 0) return null;

  const LinkComponent = linkAs ?? A_AS_CONST;

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      {label && (
        <p aria-hidden="true" className={s.label()}>
          {label}
        </p>
      )}
      <ul aria-label={ariaLabel} className={s.list()}>
        {posts.map((post) => (
          <li key={post.id}>
            <LinkComponent href={post.href} className={s.link()}>
              {post.title}
            </LinkComponent>
          </li>
        ))}
      </ul>
    </div>
  );
};

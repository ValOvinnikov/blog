import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { TextLink } from '@blog/ui/components/atoms/text-link';

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
            <TextLink
              href={post.href}
              as={linkAs}
              appearance="accent"
              className={s.link()}
            >
              {post.title}
            </TextLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

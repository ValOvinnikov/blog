import {
  A_AS_CONST,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Heading } from '@blog/ui/components/atoms/heading';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
  type THeadingLevel,
} from '@blog/ui/lib/react';
import { cloneElement, Fragment, type ElementType } from 'react';

import { TaxonomyCardPosts } from './components/posts/taxonomy-card-posts';
import { taxonomyCardVariants } from './taxonomy-card-variants';

const TaxonomyCardParts = {
  Posts: TaxonomyCardPosts,
} satisfies Record<string, ElementType>;

export type TTaxonomyCardProps = IWithClassName &
  IWithDataTestId & {
    title: string;
    description?: string;
    postCountLabel: string;
    href: string;
    headingLevel: THeadingLevel;
    accessibleNameSeparator?: string;
    linkAs?: TAnchorElementType;
    children?: TCompoundChildren<typeof TaxonomyCardParts>;
  };

const s = taxonomyCardVariants();

/** Summary card for a taxonomy entry (topic or tag) in a listing: title, optional description, and post count, linking to the entry's archive. */
const TaxonomyCardRoot = ({
  title,
  description,
  postCountLabel,
  href,
  headingLevel,
  accessibleNameSeparator = ', ',
  linkAs,
  children,
  className,
  dataTestId,
}: TTaxonomyCardProps) => {
  const LinkComponent = linkAs ?? A_AS_CONST;
  const { slots, unmatched } = mapCompoundSlots(children, TaxonomyCardParts);
  const posts = slots.Posts
    ? cloneElement(slots.Posts, {
        linkAs: LinkComponent as TAnchorElementType,
      })
    : slots.Posts;

  return (
    <article className={s.root({ class: className })} data-testid={dataTestId}>
      <Heading level={headingLevel} visual="card">
        <LinkComponent href={href} className={s.link()}>
          <span aria-hidden="true">{title}</span>
          <span className={s.accessibleName()}>
            {title}
            {accessibleNameSeparator}
            {postCountLabel}
          </span>
        </LinkComponent>
      </Heading>
      {description && <p className={s.description()}>{description}</p>}
      {posts}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
      <p className={s.count()}>{postCountLabel}</p>
    </article>
  );
};

export const TaxonomyCard: TCompoundComponent<
  typeof TaxonomyCardRoot,
  typeof TaxonomyCardParts
> = Object.assign(TaxonomyCardRoot, TaxonomyCardParts);

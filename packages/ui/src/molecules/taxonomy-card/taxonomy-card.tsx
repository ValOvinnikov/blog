import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Heading } from '@blog/ui/atoms/heading';
import {
  mapCompoundSlots,
  resolveComponent,
  type TCompoundChildren,
  type TCompoundComponent,
  type THeadingLevel,
} from '@blog/ui/lib/react';
import {
  cloneElement,
  Fragment,
  type ElementType,
  type ReactElement,
} from 'react';

import {
  TaxonomyCardPosts,
  type TTaxonomyCardPostsProps,
} from './components/posts/taxonomy-card-posts';
import { taxonomyCardVariants } from './taxonomy-card-variants';

const TaxonomyCardParts = {
  Posts: TaxonomyCardPosts,
} satisfies Record<string, ElementType>;

export type TTaxonomyCardProps = IWithClassName &
  IWithDataTestId & {
    title: string;
    description?: string;
    /** Post count, pre-formatted and pluralized by the app (e.g. "5 posts", "1 post"). */
    postCountLabel: string;
    href: string;
    /** Heading depth for `title` — the caller decides based on where the card sits in the page outline. */
    headingLevel: THeadingLevel;
    /** Joins `title` and `postCountLabel` in the link's accessible name. Defaults to `', '`; override for scripts where that punctuation reads wrong. */
    accessibleNameSeparator?: string;
    /** Component the card's link renders as — pass the app router's Link for client-side navigation. Defaults to a plain `<a>`. Also applied to `TaxonomyCard.Posts`' links. */
    linkAs?: TAnchorElementType;
    children?: TCompoundChildren<typeof TaxonomyCardParts>;
  };

const s = taxonomyCardVariants();

/**
 * TaxonomyCard — summary card for a taxonomy entry (topic or tag) in a listing:
 * title, optional description, and post count, linking to the entry's archive.
 * Composes an optional `TaxonomyCard.Posts` slot.
 */
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
  const LinkComponent = resolveComponent(linkAs, 'a');
  const { slots, unmatched } = mapCompoundSlots(children, TaxonomyCardParts);
  const posts = slots.Posts
    ? cloneElement(slots.Posts as ReactElement<TTaxonomyCardPostsProps>, {
        linkAs: LinkComponent as TAnchorElementType,
      })
    : slots.Posts;

  return (
    <article className={s.root({ class: className })} data-testid={dataTestId}>
      <Heading level={headingLevel} visual="card">
        {/* eslint-disable-next-line react-hooks/static-components -- resolveComponent returns `linkAs`/fallback verbatim, so the reference stays stable across renders */}
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

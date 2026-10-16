import {
  A_AS_CONST,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Heading } from '@blog/ui/components/atoms/heading';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
  type THeadingLevel,
} from '@blog/ui/lib/react';
import { cloneElement, Fragment, type ElementType } from 'react';

import { TaxonomyCardPosts } from './components/posts/taxonomy-card-posts';
import {
  taxonomyCardVariants,
  type TTaxonomyCardVariants,
} from './taxonomy-card-variants';

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
    isInteractive?: TTaxonomyCardVariants['isInteractive'];
    children?: TCompoundChildren<typeof TaxonomyCardParts>;
  };

/** Summary card for a topic or tag in a listing, linking to its archive. */
const TaxonomyCardRoot = ({
  title,
  description,
  postCountLabel,
  href,
  headingLevel,
  accessibleNameSeparator = ', ',
  linkAs,
  isInteractive,
  children,
  className,
  dataTestId,
}: TTaxonomyCardProps) => {
  const s = taxonomyCardVariants({ isInteractive });
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
        <TextLink
          href={href}
          as={LinkComponent}
          appearance="quiet"
          isStretched={true}
        >
          <span aria-hidden="true">{title}</span>
          <span className={s.accessibleName()}>
            {title}
            {accessibleNameSeparator}
            {postCountLabel}
          </span>
        </TextLink>
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

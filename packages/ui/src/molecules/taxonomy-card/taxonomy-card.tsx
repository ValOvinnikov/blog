import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Heading } from '@blog/ui/atoms/heading';
import type { THeadingLevel } from '@blog/ui/lib/react';
import type { ElementType } from 'react';

import { taxonomyCardVariants } from './taxonomy-card-variants';

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
    /** Component the card's link renders as — pass the app router's Link for client-side navigation. Defaults to a plain `<a>`. */
    linkAs?: TAnchorElementType;
  };

const s = taxonomyCardVariants();

/**
 * TaxonomyCard — summary card for a taxonomy entry (topic or tag) in a listing:
 * title, optional description, and post count, linking to the entry's archive.
 */
export const TaxonomyCard = ({
  title,
  description,
  postCountLabel,
  href,
  headingLevel,
  accessibleNameSeparator = ', ',
  linkAs,
  className,
  dataTestId,
}: TTaxonomyCardProps) => {
  const LinkComponent = (linkAs ?? 'a') as ElementType;

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
      <p className={s.count()}>{postCountLabel}</p>
    </article>
  );
};

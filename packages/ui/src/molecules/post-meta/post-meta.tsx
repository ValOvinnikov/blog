import { type IWithDataTestId, Size } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Avatar } from '@blog/ui/atoms/avatar';
import { MetaSeparator } from '@blog/ui/atoms/meta-separator';
import { Fragment, type ElementType, type ReactNode } from 'react';

import { postMetaVariants } from './post-meta-variants';

export interface IPostMetaProps extends IWithDataTestId {
  author: {
    name: string;
    imageUrl?: string;
    /** Link target for the author name — omit to render plain text. `PostMeta` never imports routes; the href is built and passed in by `apps/web`. */
    href?: string;
  };
  /** ISO 8601 date string, used only for `<time dateTime>`. */
  publishedAt: string;
  /** Human-readable date string, pre-formatted in the web layer. */
  formattedDate: string;
  readingTimeMinutes?: number;
  /** Post's categories, rendered as uppercase links at the end of the strip, separated by a middot — omit or pass an empty array to render no category segment. */
  categories?: {
    label: string;
    href: string;
  }[];
  /** Component each category link renders as — pass the app router's Link for client-side navigation. Defaults to a plain `<a>`. */
  linkAs?: TAnchorElementType;
  /** Opaque share widget, right-aligned in the strip — omit to render `PostMeta` without a share action. `PostMeta` knows nothing about its contents or state; the interactive widget is built in `apps/web` and passed in. */
  share?: ReactNode;
  className?: string;
}

const s = postMetaVariants();

/**
 * PostMeta — post detail metadata strip: author avatar + name, publish date,
 * estimated reading time, and an optional list of category links.
 */
export const PostMeta = ({
  author,
  publishedAt,
  formattedDate,
  readingTimeMinutes,
  categories,
  linkAs,
  share,
  className,
  dataTestId,
}: IPostMetaProps) => {
  const LinkComponent = (linkAs ?? 'a') as ElementType;

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <span className={s.author()}>
        <Avatar
          name={author.name}
          alt={author.name}
          src={author.imageUrl}
          size={Size.SM}
        />
        {author.href ? (
          <LinkComponent href={author.href} className={s.authorName()}>
            {author.name}
          </LinkComponent>
        ) : (
          <span className={s.authorName()}>{author.name}</span>
        )}
      </span>
      <MetaSeparator />
      <time dateTime={publishedAt}>{formattedDate}</time>
      {readingTimeMinutes !== undefined && (
        <>
          <MetaSeparator />
          <span>{readingTimeMinutes} min read</span>
        </>
      )}
      {categories && categories.length > 0 && (
        <>
          <MetaSeparator />
          {categories.map((category, index) => (
            <Fragment key={category.href}>
              {index > 0 && <MetaSeparator />}
              <LinkComponent href={category.href} className={s.category()}>
                {category.label}
              </LinkComponent>
            </Fragment>
          ))}
        </>
      )}
      {share && <div className={s.share()}>{share}</div>}
    </div>
  );
};

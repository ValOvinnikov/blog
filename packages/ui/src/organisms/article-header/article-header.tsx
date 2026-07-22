import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { MetaSeparator } from '@blog/ui/atoms/meta-separator';
import { Text } from '@blog/ui/atoms/text';
import { PostMeta, type IPostMetaProps } from '@blog/ui/molecules/post-meta';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Fragment } from 'react';

import { articleHeaderVariants } from './article-header-variants';

export interface IArticleHeaderCategory {
  label: string;
  href: string;
}

export interface IArticleHeaderProps
  extends Omit<ComponentPropsWithoutRef<'header'>, 'title'>, IWithDataTestId {
  /** Post categories, rendered as inline eyebrow links separated by a middot. Omit or pass an empty array to render no eyebrow. */
  categories?: IArticleHeaderCategory[];
  /** Component the category links render as — pass the app router's Link for client-side navigation. */
  linkAs?: TAnchorElementType;
  title: string;
  /** Lead paragraph rendered below the metadata strip. Omit to render no lead. */
  lead?: string;
  /** Forwarded to `PostMeta` as-is (author, publishedAt, formattedDate, readingTimeMinutes?, share?). Omit to render no `PostMeta` strip. */
  meta?: Omit<IPostMetaProps, 'className' | 'dataTestId'>;
  /** Opaque cover media slot (e.g. a wrapped `SanityImage`), rendered below the lead. Omit to render no cover media. */
  coverMedia?: ReactNode;
}

/**
 * ArticleHeader — post detail heading area: category eyebrow links, title,
 * metadata strip, lead paragraph, and an optional cover media slot.
 */
export const ArticleHeader = ({
  categories,
  linkAs,
  title,
  lead,
  meta,
  coverMedia,
  className,
  dataTestId,
  ...rest
}: IArticleHeaderProps) => {
  const s = articleHeaderVariants();

  return (
    <header
      className={s.root({ class: className })}
      data-testid={dataTestId}
      {...rest}
    >
      {categories && categories.length > 0 && (
        <div className={s.categories()}>
          {categories.map((category, index) => (
            <Fragment key={category.href}>
              {index > 0 && <MetaSeparator />}
              <Eyebrow href={category.href} linkAs={linkAs}>
                {category.label}
              </Eyebrow>
            </Fragment>
          ))}
        </div>
      )}
      <Heading level={1} visual="post" className={s.title()}>
        {title}
      </Heading>
      {meta && <PostMeta {...meta} />}
      {lead && (
        <Text variant="lead" className={s.lead()}>
          {lead}
        </Text>
      )}
      {coverMedia && <div className={s.coverMedia()}>{coverMedia}</div>}
    </header>
  );
};

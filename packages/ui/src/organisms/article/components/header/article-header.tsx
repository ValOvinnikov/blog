import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { MediaFrame } from '@blog/ui/atoms/media-frame';
import { Text } from '@blog/ui/atoms/text';
import { PostMeta, type TPostMetaProps } from '@blog/ui/molecules/post-meta';
import { type ReactNode } from 'react';

import { articleHeaderVariants } from './article-header-variants';

export interface IArticleHeaderCategory {
  label: string;
  /** Link target for the category label — omit to render plain (non-linked) text. */
  href?: string;
  /** Component the category link renders as — pass the app router's Link for client-side navigation. Defaults to a plain `<a>`. */
  linkAs?: TAnchorElementType;
}

export type TArticleHeaderProps = IWithClassName &
  IWithDataTestId & {
    title: string;
    /**
     * Category eyebrow rendered above the title as non-heading markup (a `<p>`,
     * or a link when `href` is given) — never an `<h*>`, so it can't compete
     * with the post's `<h1>`. Omit to render no eyebrow.
     */
    category?: IArticleHeaderCategory;
    /** Lead paragraph rendered below the title, inside the heading column. Omit to render no lead. */
    lead?: string;
    /** Forwarded to `PostMeta` as-is (author, publishedAt, formattedDate, readingTimeMinutes?, share?). Rendered inside the heading column, below the lead paragraph. Omit to render no `PostMeta` strip. */
    meta?: Omit<TPostMetaProps, 'className' | 'dataTestId'>;
    /** Opaque cover media slot (e.g. a wrapped `SanityImage`), rendered below the metadata strip, capped at `max-w-page` (1120px). Omit to render no cover media. */
    coverMedia?: ReactNode;
  };

/**
 * Article.Header — post detail heading area: category eyebrow, title,
 * lead paragraph, metadata strip, and an optional wide cover media slot.
 * Breadcrumb navigation stays a separate, page-composed concern — the
 * eyebrow here is a visual category label, not a nav landmark.
 */
export const ArticleHeader = ({
  title,
  category,
  lead,
  meta,
  coverMedia,
  className,
  dataTestId,
}: TArticleHeaderProps) => {
  const s = articleHeaderVariants();

  return (
    <header className={s.root({ class: className })} data-testid={dataTestId}>
      <div className={s.headingGroup()}>
        {category && (
          <Eyebrow
            href={category.href}
            linkAs={category.linkAs}
            className={s.category()}
          >
            {category.label}
          </Eyebrow>
        )}
        <Heading level={1} visual="post" className={s.title()}>
          {title}
        </Heading>
        {lead && (
          <Text variant="lead" className={s.lead()}>
            {lead}
          </Text>
        )}
        {meta && (
          <div className={s.meta()}>
            <PostMeta
              author={meta.author}
              publishedAt={meta.publishedAt}
              formattedDate={meta.formattedDate}
              readingTimeMinutes={meta.readingTimeMinutes}
              linkAs={meta.linkAs}
              share={meta.share}
            />
          </div>
        )}
      </div>
      {coverMedia && (
        <MediaFrame ratio="video" className={s.coverMedia()}>
          {coverMedia}
        </MediaFrame>
      )}
    </header>
  );
};

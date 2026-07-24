import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { MediaFrame } from '@blog/ui/atoms/media-frame';
import { Text } from '@blog/ui/atoms/text';
import { PostMeta, type IPostMetaProps } from '@blog/ui/molecules/post-meta';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { articleHeaderVariants } from './article-header-variants';

export interface IArticleHeaderCategory {
  label: string;
  href: string;
}

export interface IArticleHeaderProps
  extends Omit<ComponentPropsWithoutRef<'header'>, 'title'>, IWithDataTestId {
  /** Post's category, rendered as an eyebrow link above the title. Omit to render no eyebrow. */
  category?: IArticleHeaderCategory;
  /** Component the category link renders as — pass the app router's Link for client-side navigation. */
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
 * Article.Header — post detail heading area: category eyebrow, title,
 * metadata strip, lead paragraph, and an optional cover media slot.
 */
export const ArticleHeader = ({
  category,
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
      {category && (
        <div className={s.categories()}>
          <Eyebrow href={category.href} linkAs={linkAs}>
            {category.label}
          </Eyebrow>
        </div>
      )}
      <Heading level={1} visual="post" className={s.title()}>
        {title}
      </Heading>
      {meta && (
        <div className={s.meta()}>
          <PostMeta {...meta} />
        </div>
      )}
      {lead && (
        <Text variant="lead" className={s.lead()}>
          {lead}
        </Text>
      )}
      {coverMedia && (
        <MediaFrame ratio="video" className={s.coverMedia()}>
          {coverMedia}
        </MediaFrame>
      )}
    </header>
  );
};

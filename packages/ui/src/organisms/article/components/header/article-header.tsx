import type { IWithDataTestId } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import { MediaFrame } from '@blog/ui/atoms/media-frame';
import { Text } from '@blog/ui/atoms/text';
import { PostMeta, type IPostMetaProps } from '@blog/ui/molecules/post-meta';
import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { articleHeaderVariants } from './article-header-variants';

export interface IArticleHeaderProps
  extends Omit<ComponentPropsWithoutRef<'header'>, 'title'>, IWithDataTestId {
  title: string;
  /** Lead paragraph rendered below the metadata strip. Omit to render no lead. */
  lead?: string;
  /** Forwarded to `PostMeta` as-is (author, publishedAt, formattedDate, readingTimeMinutes?, share?). Omit to render no `PostMeta` strip. */
  meta?: Omit<IPostMetaProps, 'className' | 'dataTestId'>;
  /** Opaque cover media slot (e.g. a wrapped `SanityImage`), rendered below the lead. Omit to render no cover media. */
  coverMedia?: ReactNode;
}

/**
 * Article.Header — post detail heading area: title, metadata strip, lead
 * paragraph, and an optional cover media slot. Category navigation lives in
 * the page-composed `Breadcrumbs` trail, not here.
 */
export const ArticleHeader = ({
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
    <header className={className} data-testid={dataTestId} {...rest}>
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

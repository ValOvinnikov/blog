import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Eyebrow } from '@blog/ui/atoms/eyebrow';
import { Heading } from '@blog/ui/atoms/heading';
import { MediaFrame } from '@blog/ui/atoms/media-frame';
import { Text } from '@blog/ui/atoms/text';
import { PostMeta, type TPostMetaProps } from '@blog/ui/molecules/post-meta';
import { type ReactNode } from 'react';

import { articleHeaderVariants } from './article-header-variants';

export interface IArticleHeaderTopic {
  label: string;
  href?: string;
  linkAs?: TAnchorElementType;
}

export type TArticleHeaderProps = IWithClassName &
  IWithDataTestId & {
    title: string;
    topic?: IArticleHeaderTopic;
    lead?: string;
    meta?: Omit<TPostMetaProps, 'className' | 'dataTestId'>;
    coverMedia?: ReactNode;
  };

/** Post detail heading area: topic eyebrow, title, lead paragraph, metadata strip, and an optional wide cover media slot. */
export const ArticleHeader = ({
  title,
  topic,
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
        {topic && (
          <Eyebrow
            href={topic.href}
            linkAs={topic.linkAs}
            className={s.topic()}
          >
            {topic.label}
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

import {
  type IWithClassName,
  type IWithDataTestId,
  MEDIA_RATIO,
  TEXT_ROLE,
} from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
import { Eyebrow } from '@shinefold/ui/components/atoms/eyebrow';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { MediaFrame } from '@shinefold/ui/components/atoms/media-frame';
import { Text } from '@shinefold/ui/components/atoms/text';
import {
  PostMeta,
  type TPostMetaProps,
} from '@shinefold/ui/components/molecules/post-meta';
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
    action?: ReactNode;
  };

/** The opening of a post page, above its body. */
export const ArticleHeader = ({
  title,
  topic,
  lead,
  meta,
  coverMedia,
  action,
  className,
  dataTestId,
}: TArticleHeaderProps) => {
  const hasAction = Boolean(action);
  const s = articleHeaderVariants({ hasAction });

  const topicEyebrow = topic && (
    <Eyebrow href={topic.href} linkAs={topic.linkAs} className={s.topic()}>
      {topic.label}
    </Eyebrow>
  );

  return (
    <header className={s.root({ class: className })} data-testid={dataTestId}>
      <div className={s.headingGroup()}>
        {hasAction ? (
          <div className={s.topicRow()}>
            {topicEyebrow}
            <div className={s.action()}>{action}</div>
          </div>
        ) : (
          topicEyebrow
        )}
        <Heading level={1} visual={TEXT_ROLE.POST_TITLE} className={s.title()}>
          {title}
        </Heading>
        {lead && (
          <div className={s.lead()} data-slot="lead">
            <Text textRole={TEXT_ROLE.INTRO}>{lead}</Text>
          </div>
        )}
        {meta && (
          <div className={s.meta()}>
            <PostMeta
              author={meta.author}
              publishedAt={meta.publishedAt}
              formattedDate={meta.formattedDate}
              readingTime={meta.readingTime}
              linkAs={meta.linkAs}
              share={meta.share}
            />
          </div>
        )}
      </div>
      {coverMedia && (
        <div className={s.coverMedia()} data-slot="cover-media">
          <MediaFrame ratio={MEDIA_RATIO.VIDEO}>{coverMedia}</MediaFrame>
        </div>
      )}
    </header>
  );
};

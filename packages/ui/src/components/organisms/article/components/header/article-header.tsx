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

const s = articleHeaderVariants();

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
    belowMeta?: ReactNode;
  };

/** The opening of a post page, above its body. */
export const ArticleHeader = ({
  title,
  topic,
  lead,
  meta,
  coverMedia,
  belowMeta,
  className,
  dataTestId,
}: TArticleHeaderProps) => (
  <header className={s.root({ class: className })} data-testid={dataTestId}>
    <div className={s.headingGroup()}>
      {topic && (
        <Eyebrow href={topic.href} linkAs={topic.linkAs} className={s.topic()}>
          {topic.label}
        </Eyebrow>
      )}
      <Heading level={1} visual={TEXT_ROLE.POST_TITLE} className={s.title()}>
        {title}
      </Heading>
      {lead && (
        <div className={s.lead()}>
          <Text textRole={TEXT_ROLE.INTRO} className={s.leadText()}>
            {lead}
          </Text>
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
            actions={meta.actions}
          />
        </div>
      )}
      {belowMeta && <div className={s.belowMeta()}>{belowMeta}</div>}
    </div>
    {coverMedia && (
      <div className={s.coverMedia()}>
        <MediaFrame ratio={MEDIA_RATIO.VIDEO}>{coverMedia}</MediaFrame>
      </div>
    )}
  </header>
);

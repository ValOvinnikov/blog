import { ICONS, SIZE, type IWithDataTestId } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import type { THeadingLevel } from '@blog/ui/lib/react';
import { PostCard } from '@blog/ui/molecules/post-card';
import { SmartLink } from '@web/components/shared/smart-link';
import type { ReactNode } from 'react';

import { postCardItemVariants } from './post-card-item-variants';

interface IPostCardTopicData {
  title: string;
}

export interface IPostCardData {
  id: string;
  href: string;
  title: string;
  excerpt?: string;
  publishedAt: string;
  formattedDate: string;
  readingTime?: string;
  topic: IPostCardTopicData;
  /** Pre-rendered image node the web layer builds; never a URL for this component to resolve. */
  image?: ReactNode;
}

export type TPostCardItemProps = IWithDataTestId & {
  item: IPostCardData;
  /** Renders a `PostCard.Media` region — the empty frame when `item.image` is absent. Omit to render no media region at all. */
  hasImage?: boolean;
  /** Heading depth for the card's title — the caller decides based on where the listing sits in the page outline. Defaults to `3`. */
  headingLevel?: THeadingLevel;
  isLead?: boolean;
  isSplit?: boolean;
};

const s = postCardItemVariants();

/**
 * PostCardItem — the one post-to-card mapping every listing in `apps/web`
 * renders: an `IPostCardData` item into `PostCard`'s `Media`/`Meta`/`Title`/
 * `Footer` slots, titled via `SmartLink`.
 */
export const PostCardItem = ({
  item,
  hasImage,
  headingLevel = 3,
  isLead,
  isSplit,
  dataTestId,
}: TPostCardItemProps) => (
  <PostCard
    excerpt={item.excerpt}
    isLead={isLead}
    isSplit={isSplit}
    dataTestId={dataTestId}
  >
    {hasImage && (
      <PostCard.Media dataTestId="post-card-media">{item.image}</PostCard.Media>
    )}
    <PostCard.Meta
      dateValue={item.publishedAt}
      dateLabel={item.formattedDate}
      readingTime={item.readingTime}
    />
    <PostCard.Title level={headingLevel}>
      <SmartLink href={item.href} className={s.titleLink()}>
        {item.title}
      </SmartLink>
    </PostCard.Title>
    <PostCard.Footer
      topic={item.topic.title}
      trailingIcon={
        <Icon
          name={ICONS.ARROW}
          size={SIZE.SM}
          dataTestId="post-card-footer-arrow"
        />
      }
    />
  </PostCard>
);

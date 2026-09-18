import { ICONS, SIZE, type IWithDataTestId } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import type { THeadingLevel } from '@blog/ui/lib/react';
import { MediaCard } from '@blog/ui/molecules/media-card';
import { SmartLink } from '@web/components/shared/smart-link';
import type { ReactNode } from 'react';

import { mediaCardItemVariants } from './media-card-item-variants';

interface IMediaCardTopicData {
  title: string;
}

export interface IMediaCardData {
  id: string;
  href: string;
  title: string;
  excerpt?: string;
  publishedAt: string;
  formattedDate: string;
  readingTime?: string;
  topic: IMediaCardTopicData;
  /** Pre-rendered image node the web layer builds; never a URL for this component to resolve. */
  image?: ReactNode;
}

export type TMediaCardItemProps = IWithDataTestId & {
  item: IMediaCardData;
  /** Renders a `MediaCard.Media` region — the empty frame when `item.image` is absent. Omit to render no media region at all. */
  hasImage?: boolean;
  /** Heading depth for the card's title — the caller decides based on where the listing sits in the page outline. Defaults to `3`. */
  headingLevel?: THeadingLevel;
  isLead?: boolean;
  isSplit?: boolean;
};

const s = mediaCardItemVariants();

/**
 * MediaCardItem — the one post-to-card mapping every listing in `apps/web`
 * renders: an `IMediaCardData` item into `MediaCard`'s `Media`/`Meta`/`Title`/
 * `Footer` slots, titled via `SmartLink`.
 */
export const MediaCardItem = ({
  item,
  hasImage,
  headingLevel = 3,
  isLead,
  isSplit,
  dataTestId,
}: TMediaCardItemProps) => (
  <MediaCard
    excerpt={item.excerpt}
    isLead={isLead}
    isSplit={isSplit}
    dataTestId={dataTestId}
  >
    {hasImage && (
      <MediaCard.Media dataTestId="media-card-media">
        {item.image}
      </MediaCard.Media>
    )}
    <MediaCard.Meta
      dateValue={item.publishedAt}
      dateLabel={item.formattedDate}
      readingTime={item.readingTime}
    />
    <MediaCard.Title level={headingLevel}>
      <SmartLink href={item.href} className={s.titleLink()}>
        {item.title}
      </SmartLink>
    </MediaCard.Title>
    <MediaCard.Footer
      topic={item.topic.title}
      trailingIcon={
        <Icon
          name={ICONS.ARROW}
          size={SIZE.SM}
          dataTestId="media-card-footer-arrow"
        />
      }
    />
  </MediaCard>
);

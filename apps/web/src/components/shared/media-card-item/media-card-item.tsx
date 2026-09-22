import { ICONS, SIZE, type IWithDataTestId } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import type { THeadingLevel } from '@blog/ui/lib/react';
import { MediaCard } from '@blog/ui/molecules/media-card';
import { SmartLink } from '@web/components/shared/smart-link';
import { stretchedLinkVariants } from '@web/components/shared/stretched-link';
import type { ReactNode } from 'react';

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
  image?: ReactNode;
}

export type TMediaCardItemProps = IWithDataTestId & {
  item: IMediaCardData;
  hasImage?: boolean;
  headingLevel?: THeadingLevel;
  isLead?: boolean;
  isSplit?: boolean;
};

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
      <SmartLink href={item.href} className={stretchedLinkVariants()}>
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

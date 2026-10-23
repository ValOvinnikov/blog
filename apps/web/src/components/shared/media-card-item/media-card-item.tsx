import { type IWithDataTestId } from '@blog/config';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import type { THeadingLevel } from '@blog/ui/lib/react';
import { SmartLink } from '@web/components/shared/smart-link';
import { MEDIA_CARD_MEDIA_TEST_ID } from '@web/constants/media-card';
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
    isInteractive={Boolean(item.href)}
    dataTestId={dataTestId}
  >
    {hasImage && Boolean(item.image) && (
      <MediaCard.Media dataTestId={MEDIA_CARD_MEDIA_TEST_ID}>
        {item.image}
      </MediaCard.Media>
    )}
    <MediaCard.Meta
      dateValue={item.publishedAt}
      dateLabel={item.formattedDate}
      readingTime={item.readingTime}
    />
    <MediaCard.Title level={headingLevel}>
      <MediaCard.Link href={item.href} as={SmartLink}>
        {item.title}
      </MediaCard.Link>
    </MediaCard.Title>
    <MediaCard.Footer topic={item.topic.title} />
  </MediaCard>
);

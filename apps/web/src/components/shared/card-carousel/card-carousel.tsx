'use client';

import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariant,
} from '@blog/config';
import { Carousel } from '@blog/ui/organisms/carousel';
import {
  type IMediaCardData,
  MediaCardItem,
} from '@web/components/shared/media-card-item';
import { useTranslations } from 'next-intl';

import { cardCarouselVariants } from './card-carousel-variants';

export interface ICardCarouselProps extends IWithClassName, IWithDataTestId {
  items: IMediaCardData[];
  hasImages?: boolean;
  title: string;
  tone?: TBrandVariant;
}

const s = cardCarouselVariants();

/**
 * CardCarousel — the `'use client'` wrapper that gives a row of cards
 * a swipeable carousel via `@blog/ui`'s `Carousel`. `renderItem` is defined
 * here rather than in a Server Component view because a function prop can
 * never cross the server→client boundary. The inner region is named
 * distinctly from the enclosing `Section`'s landmark so the two don't share
 * an identical name in the accessibility tree.
 */
export const CardCarousel = ({
  items,
  hasImages,
  title,
  tone,
  className,
  dataTestId,
}: ICardCarouselProps) => {
  const t = useTranslations('carousel');

  return (
    <Carousel
      items={items}
      renderItem={({ item }) => (
        <MediaCardItem item={item} hasImage={hasImages} />
      )}
      getItemKey={({ item }) => item.id}
      slideClassName={s.slide()}
      ariaLabel={t('regionLabel', { title })}
      previousLabel={t('previousAriaLabel')}
      nextLabel={t('nextAriaLabel')}
      tone={tone}
      className={className}
      dataTestId={dataTestId}
    />
  );
};

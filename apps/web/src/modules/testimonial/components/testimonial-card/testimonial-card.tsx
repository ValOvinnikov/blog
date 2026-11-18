import {
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
} from '@shinefold/config';
import type { TTestimonialItem } from '@shinefold/service';
import { Avatar } from '@shinefold/ui/components/atoms/avatar';
import { QuoteCard } from '@shinefold/ui/components/molecules/quote-card';
import { PortableText } from '@web/components/shared/portable-text';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';

import { testimonialAvatarImageVariants } from './testimonial-card-variants';

const AVATAR_IMAGE_SIZE_PX = { DEFAULT: 80, SPOTLIGHT: 112 } as const;

export interface ITestimonialCardProps extends IWithClassName, IWithDataTestId {
  item: TTestimonialItem;
  align: 'left' | 'center';
  isSpotlight?: boolean;
}

export const TestimonialCard = ({
  item,
  align,
  isSpotlight = false,
  className,
  dataTestId,
}: ITestimonialCardProps) => {
  const imageSize = isSpotlight
    ? AVATAR_IMAGE_SIZE_PX.SPOTLIGHT
    : AVATAR_IMAGE_SIZE_PX.DEFAULT;

  return (
    <QuoteCard
      role={item.role}
      align={align}
      isSpotlight={isSpotlight}
      className={className}
      dataTestId={dataTestId}
    >
      <QuoteCard.Quote>
        <PortableText value={item.quote} />
      </QuoteCard.Quote>
      <QuoteCard.Avatar>
        {item.image ? (
          <SanityImage
            image={item.image}
            width={imageSize}
            height={imageSize}
            className={testimonialAvatarImageVariants({ isSpotlight })}
          />
        ) : (
          <Avatar
            alt={item.name}
            name={item.name}
            size={isSpotlight ? SIZE.LG : SIZE.MD}
          />
        )}
      </QuoteCard.Avatar>
      <QuoteCard.Name>
        {item.link ? (
          <SmartLink href={item.link.href} target={item.link.target}>
            {item.name}
          </SmartLink>
        ) : (
          <span>{item.name}</span>
        )}
      </QuoteCard.Name>
    </QuoteCard>
  );
};

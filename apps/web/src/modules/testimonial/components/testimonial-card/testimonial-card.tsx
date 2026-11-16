import {
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariant,
} from '@shinefold/config';
import type { TTestimonialItem } from '@shinefold/service';
import { Avatar } from '@shinefold/ui/components/atoms/avatar';
import { QuoteCard } from '@shinefold/ui/components/molecules/quote-card';
import { PortableText } from '@web/components/shared/portable-text';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';

import { testimonialAvatarImageVariants } from './testimonial-card-variants';

const AVATAR_IMAGE_SIZE_PX = { default: 80, spotlight: 112 } as const;

export interface ITestimonialCardProps extends IWithClassName, IWithDataTestId {
  item: TTestimonialItem;
  align: 'left' | 'center';
  tone: TBrandVariant;
  isSpotlight?: boolean;
}

export const TestimonialCard = ({
  item,
  align,
  tone,
  isSpotlight = false,
  className,
  dataTestId,
}: ITestimonialCardProps) => {
  const imageSize = isSpotlight
    ? AVATAR_IMAGE_SIZE_PX.spotlight
    : AVATAR_IMAGE_SIZE_PX.default;

  return (
    <QuoteCard
      role={item.role}
      align={align}
      isSpotlight={isSpotlight}
      className={className}
      tone={tone}
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

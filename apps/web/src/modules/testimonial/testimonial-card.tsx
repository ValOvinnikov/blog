import { SIZE, type IWithDataTestId, type TBrandVariantOf } from '@blog/config';
import type { TTestimonialItem } from '@blog/service';
import { Avatar } from '@blog/ui/atoms/avatar';
import { QuoteCard } from '@blog/ui/molecules/quote-card';
import { PortableText } from '@web/components/shared/portable-text';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';

import { testimonialAvatarImageVariants } from './testimonial-card-variants';

const AVATAR_IMAGE_SIZE_PX = { default: 80, spotlight: 112 } as const;

export interface ITestimonialCardProps extends IWithDataTestId {
  item: TTestimonialItem;
  align: 'left' | 'center';
  tone: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  isSpotlight?: boolean;
}

export const TestimonialCard = ({
  item,
  align,
  tone,
  isSpotlight = false,
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
          <SmartLink
            href={item.link.href}
            target={item.link.target}
            aria-label={item.link.ariaLabel}
          >
            {item.name}
          </SmartLink>
        ) : (
          <span>{item.name}</span>
        )}
      </QuoteCard.Name>
    </QuoteCard>
  );
};

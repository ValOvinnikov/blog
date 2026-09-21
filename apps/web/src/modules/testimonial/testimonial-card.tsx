import { SIZE, type IWithDataTestId, type TBrandVariantOf } from '@blog/config';
import type { TTestimonialItem } from '@blog/service';
import { Avatar } from '@blog/ui/atoms/avatar';
import { QuoteCard } from '@blog/ui/molecules/quote-card';
import { SmartLink } from '@web/components/shared/smart-link';

export type TTestimonialCardItem = Omit<TTestimonialItem, 'photo'> & {
  avatarSrc?: string;
  avatarAlt?: string;
};

export interface ITestimonialCardProps extends IWithDataTestId {
  item: TTestimonialCardItem;
  align: 'left' | 'center';
  tone: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  isSpotlight?: boolean;
}

export const TestimonialCard = ({
  item,
  align,
  tone,
  isSpotlight,
  dataTestId,
}: ITestimonialCardProps) => (
  <QuoteCard
    quote={item.quote}
    role={item.role}
    align={align}
    isSpotlight={isSpotlight}
    tone={tone}
    dataTestId={dataTestId}
  >
    <QuoteCard.Avatar>
      <Avatar
        src={item.avatarSrc}
        alt={item.avatarAlt ?? item.name}
        name={item.name}
        size={isSpotlight ? SIZE.LG : SIZE.MD}
      />
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

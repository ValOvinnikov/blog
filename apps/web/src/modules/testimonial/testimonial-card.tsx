import type { IWithDataTestId, TBrandVariant } from '@blog/config';
import type { TTestimonialItem } from '@blog/service';
import { QuoteCard } from '@blog/ui/molecules/quote-card';
import { SmartLink } from '@web/components/shared/smart-link';

export type TTestimonialCardItem = Omit<TTestimonialItem, 'photo'> & {
  avatarSrc?: string;
  avatarAlt?: string;
};

export interface ITestimonialCardProps extends IWithDataTestId {
  item: TTestimonialCardItem;
  align: 'left' | 'center';
  tone: TBrandVariant;
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
    name={item.name}
    role={item.role}
    avatarSrc={item.avatarSrc}
    avatarAlt={item.avatarAlt}
    align={align}
    isSpotlight={isSpotlight}
    tone={tone}
    href={item.link?.href}
    linkAs={SmartLink}
    dataTestId={dataTestId}
  />
);

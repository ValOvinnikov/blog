import {
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
  type TBrandVariantOf,
} from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { cloneElement, Fragment, type ElementType } from 'react';

import { QuoteCardAvatar } from './components/avatar/quote-card-avatar';
import { QuoteCardName } from './components/name/quote-card-name';
import { QuoteCardQuote } from './components/quote/quote-card-quote';
import {
  quoteCardVariants,
  type TQuoteCardVariants,
} from './quote-card-variants';

const QuoteCardParts = {
  Quote: QuoteCardQuote,
  Avatar: QuoteCardAvatar,
  Name: QuoteCardName,
} satisfies Record<string, ElementType>;

export type TQuoteCardProps = IWithClassName &
  IWithDataTestId & {
    role?: string;
    align?: TQuoteCardVariants['align'];
    isSpotlight?: boolean;
    tone: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
    children?: TCompoundChildren<typeof QuoteCardParts>;
  };

/** A testimonial quote rendered as a figure; composes a caller-supplied `QuoteCard.Quote`, `QuoteCard.Avatar`, and `QuoteCard.Name` for the quoted person. */
const QuoteCardRoot = ({
  role,
  align,
  isSpotlight = false,
  tone,
  children,
  className,
  dataTestId,
}: TQuoteCardProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, QuoteCardParts);
  const s = quoteCardVariants({
    align: isSpotlight ? 'center' : align,
    isSpotlight,
  });

  return (
    <figure className={s.root({ class: className })} data-testid={dataTestId}>
      <Icon name={ICONS.QUOTE} size={SIZE.LG} className={s.quoteMark()} />
      {slots.Quote && cloneElement(slots.Quote, { isSpotlight })}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
      <figcaption className={s.caption()}>
        {slots.Avatar}
        <div className={s.person()}>
          {slots.Name && cloneElement(slots.Name, { isSpotlight, tone })}
          {role && <span className={s.role()}>{role}</span>}
        </div>
      </figcaption>
    </figure>
  );
};

export const QuoteCard: TCompoundComponent<
  typeof QuoteCardRoot,
  typeof QuoteCardParts
> = Object.assign(QuoteCardRoot, QuoteCardParts);

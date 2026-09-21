import { cloneElement, type ReactElement } from 'react';

import {
  quoteCardNameVariants,
  type TQuoteCardNameVariants,
} from './quote-card-name-variants';

export type TQuoteCardNameProps = {
  isSpotlight?: TQuoteCardNameVariants['isSpotlight'];
  tone?: TQuoteCardNameVariants['tone'];
  children: ReactElement<{ className?: string }>;
};

/** The name slot of a `QuoteCard`; applies the quoted person's link/text treatment to whatever plain element or link the caller supplies. */
export const QuoteCardName = ({
  isSpotlight,
  tone,
  children,
}: TQuoteCardNameProps) =>
  cloneElement(children, {
    className: quoteCardNameVariants({
      isSpotlight,
      tone,
      class: children.props.className,
    }),
  });

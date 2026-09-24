import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  quoteCardQuoteVariants,
  type TQuoteCardQuoteVariants,
} from './quote-card-quote-variants';

export type TQuoteCardQuoteProps = IWithClassName &
  IWithDataTestId & {
    isSpotlight?: TQuoteCardQuoteVariants['isSpotlight'];
    children: ReactNode;
  };

/** The quote slot of a `QuoteCard`; owns the figure's `<blockquote>`, so the caller passes the quote's inner content and never a `<blockquote>` of its own. */
export const QuoteCardQuote = ({
  isSpotlight,
  className,
  dataTestId,
  children,
}: TQuoteCardQuoteProps) => (
  <blockquote
    className={quoteCardQuoteVariants({ isSpotlight, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </blockquote>
);

import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import {
  quoteCardNameVariants,
  type TQuoteCardNameVariants,
} from './quote-card-name-variants';

export type TQuoteCardNameProps = IWithClassName &
  IWithDataTestId & {
    isSpotlight?: TQuoteCardNameVariants['isSpotlight'];
    tone?: TQuoteCardNameVariants['tone'];
    children: ReactNode;
  };

/** The name slot of a `QuoteCard`; wraps the quoted person's link or text in the tone-matched link/focus treatment, on an element the component itself owns rather than the caller's link or text. */
export const QuoteCardName = ({
  isSpotlight,
  tone,
  className,
  dataTestId,
  children,
}: TQuoteCardNameProps) => (
  <span
    className={quoteCardNameVariants({ isSpotlight, tone, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </span>
);

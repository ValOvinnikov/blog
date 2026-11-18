import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { ReactNode } from 'react';

import {
  quoteCardNameVariants,
  type TQuoteCardNameVariants,
} from './quote-card-name-variants';

export type TQuoteCardNameProps = IWithClassName &
  IWithDataTestId & {
    isSpotlight?: TQuoteCardNameVariants['isSpotlight'];
    children: ReactNode;
  };

/** The name slot of a `QuoteCard`; wraps the quoted person's link or text in the link/focus treatment, on an element the component itself owns rather than the caller's link or text. */
export const QuoteCardName = ({
  isSpotlight,
  className,
  dataTestId,
  children,
}: TQuoteCardNameProps) => (
  <span
    className={quoteCardNameVariants({ isSpotlight, class: className })}
    data-testid={dataTestId}
  >
    {children}
  </span>
);

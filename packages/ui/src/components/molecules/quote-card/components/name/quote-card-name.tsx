import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { ReactNode } from 'react';

import { quoteCardNameVariants } from './quote-card-name-variants';

export type TQuoteCardNameProps = IWithClassName &
  IWithDataTestId & {
    children: ReactNode;
  };

/** The name slot of a `QuoteCard`; wraps the quoted person's link or text in the link/focus treatment, on an element the component itself owns rather than the caller's link or text. */
export const QuoteCardName = ({
  className,
  dataTestId,
  children,
}: TQuoteCardNameProps) => (
  <span
    className={quoteCardNameVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </span>
);

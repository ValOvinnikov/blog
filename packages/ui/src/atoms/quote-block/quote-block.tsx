import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { quoteBlockVariants } from './quote-block-variants';

export type TQuoteBlockProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** The accent-muted left rule + italic serif treatment for blockquotes inside Portable Text article body copy. */
export const QuoteBlock = ({
  className,
  dataTestId,
  children,
}: TQuoteBlockProps) => (
  <blockquote
    className={quoteBlockVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </blockquote>
);

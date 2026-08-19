import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { quoteBlockVariants } from './quote-block-variants';

export type TQuoteBlockProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * QuoteBlock atom — the accent-muted left rule + italic serif treatment for
 * blockquotes inside Portable Text article body copy. Always renders a
 * `<blockquote>`; not polymorphic, since a quote is always a `<blockquote>`.
 */
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
